const { createEmptyFolder, deleteFolderAndFiles, getPrivateFileUrl } = require('./bucketController');
const { getDb } = require('../config/mongodb');

const createFolder = async (req, res) => {
  const folderName = req.params.folder_name;
  const userId = req.user.user_id;
  req.actions_data = {};

  try {
    const db = getDb();
    const result = await db.collection("Folder").insertOne({
      author_id: userId,
      name: folderName,
      public: false
    });

    const folderId = result.insertedId;

    req.actions_data["create-folder"] = {
      entity: "Folder",
      record_id: folderId,
      action: "insert",
      "old_dvh": null,
      "new_dvh": null
    };

    createEmptyFolder("user-files", `${userId}/${folderId}/`);

    res.status(201).json({ folderId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateFolder = async (req, res) => {
  const { isPublic, oldFolderName, newFolderName } = req.body;
  const userId = req.user.user_id;
  req.actions_data = {};

  if (!oldFolderName) {
    return res.status(400).json({ message: "Se necesita el nombre de la carpeta a modificar."});
  }

  if (typeof isPublic !== "boolean" && !newFolderName) {
    return res.status(400).json({ message: "Se necesita al menos un campo para modificar."});
  }

  const updateFields = {};

  typeof isPublic === "boolean" && (updateFields.public = isPublic);
  newFolderName && (updateFields.name = newFolderName);

  try {
    const db = getDb();
    const result = await db.collection("Folder").findOneAndUpdate(
      {
        author_id: userId,
        name: oldFolderName
      },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(400).json({ message: `No existe la carpeta ${oldFolderName}.`});
    }

    const folderId = result.insertedId;

    req.actions_data["update-folder"] = {
      entity: "Folder",
      record_id: folderId,
      action: "update",
      "old_dvh": null,
      "new_dvh": null
    };

    res.status(200).json({ message: "se actualizó la carpeta." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteFolder = async (req, res) => {
  const folderName = req.params.folder_name;
  const userId = req.user.user_id;
  req.actions_data = {};

  try {
    const db = getDb();
    const folder = await db.collection("Folder").findOne({
      author_id: userId,
      name: folderName
    });

    if (!folder) {
      res.status(400).json({ message: `No existe la carpeta ${folderName}.` });
    }

    const folderId = folder._id;

    const fileRelationships = await db.collection("FileRelation").find({
      collection: "Folder",
      collection_id: folderId
    }).toArray();

    const fileRelationIds = fileRelationships.map(rel => rel._id);
    const fileIds = fileRelationships.map(rel => rel.file_id);

    if (fileRelationIds.length !== 0) {    
      fileRelationIds.map(id => {
        await db.collection("FileRelation").deleteOne({ _id: id });

        req.actions_data[`delete-file-relation-${id}`] = {
          entity: "FileRelation",
          record_id: id,
          action: "delete",
          "old_dvh": null,
          "new_dvh": null
        };
      });

      fileIds.map(id => {
        await db.collection("File").deleteOne({ _id: id });

        req.actions_data[`delete-file-${id}`] = {
          entity: "File",
          record_id: id,
          action: "delete",
          "old_dvh": null,
          "new_dvh": null
        };
      });
    }

    const folderPermissions = await db.collection("FolderPermission").find({
      folder_id: folderId
    }).toArray();

    const folderPermissionsIds = folderPermissions.map(per => per._id);

    if (folderPermissionsIds.length !== 0) {    
      folderPermissionsIds.map(id => {
        await db.collection("FolderPermission").deleteOne({ _id: id });

        req.actions_data[`delete-folder-permission-${id}`] = {
          entity: "FolderPermission",
          record_id: id,
          action: "delete",
          "old_dvh": null,
          "new_dvh": null
        };
      });
    }

    await db.collection("Folder").deleteOne({ _id: folderId });
    req.actions_data[`delete-folder`] = {
      entity: "Folder",
      record_id: folderId,
      action: "delete",
      "old_dvh": null,
      "new_dvh": null
    };

    deleteFolderAndFiles("user-files", `${userId}/${folderId}/`);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getFolderFiles = async (req, res) => {
  const folderName = req.params.folder_name;
  const userId = req.user.user_id;
  req.actions_data = {};

  try {
    const db = getDb();
    const folder = await db.collection("Folder").findOne({
      author_id: userId,
      name: folderName
    });

    if (!folder) {
      res.status(400).json({ message: `No existe la carpeta ${folderName}.` });
    }

    const folderId = folder._id;

    const fileRelationships = await db.collection("FileRelation").find({
      collection: "Folder",
      collection_id: folderId
    }).toArray();

    const fileIds = fileRelationships.map(rel => rel.file_id);

    if (fileIds.length !== 0) {
      const fileURLs = fileIds.map(id => {
        const file = await db.collection("File").findOne({ _id: id });
        return getPrivateFileUrl("File", `${userId}/${folderId}/${id}`)
      });
      return res.status(200).json({ fileURLs })
    }

    return res.status(400).json({ message: "No existe ningun archivo en la carpeta."})
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderFiles
};

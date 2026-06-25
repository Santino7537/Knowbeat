const { createEmptyFolder } = require('./bucketController');
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

module.exports = {
  createFolder,
  updateFolder
};
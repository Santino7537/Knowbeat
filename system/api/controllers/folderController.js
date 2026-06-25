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


module.exports = {
  createFolder
};
const { uploadFile } = require('./bucketController');
const { validateFile } = require('../utils/fileChecker')
const { getDb } = require('../config/mongodb');
const { ObjectId } = require("mongodb");
const fs = require('fs/promises');


const uploadFileInFolder = async (req, res) => {
	const folderId = req.params.folder_id;
	const userId = req.user.user_id;
	const file = req.files?.[0];
	req.actions_data = {};

	if (!file) { return res.status(400).json({ message: "No se recibió ningún archivo. "}) }
	const filePath = file.path

	try {
		const fileType = await validateFile(filePath);
		const buffer = await fs.readFile(filePath);

		const db = getDb();
		const dbFile = await db.collection("File").insertOne({
			name: file.originalname,
			size: file.size / (1024 * 1024), // En MB
			mime_type: fileType.mime
		});

		const fileId = dbFile.insertedId;

		const dbFileRelation = await db.collection("FileRelation").insertOne({
			file_id: fileId,
			collection: "Folder",
			collection_id: new ObjectId(folderId)
		});

		const fileRelationId = dbFileRelation.insertedId;

		req.actions_data["create-file"] = {
			entity: "File",
			record_id: fileId,
			action: "insert",
			"old_dvh": null,
			"new_dvh": null
		};

		req.actions_data["create-file-relation"] = {
			entity: "FileRelation",
			record_id: fileRelationId,
			action: "insert",
			"old_dvh": null,
			"new_dvh": null
		};

		await uploadFile(`user-files`, buffer, fileId, fileType.mime, `${userId}/${folderId}`);

		return res.status(201).json({ fileId });
	} catch (err) {
		return res.status(400).json({ error: err.message });
	} finally {
		if (filePath) {
			try {
				await fs.unlink(filePath);
			} catch (_) {
				// Si ya no existe o no pudo eliminarse, simplemente lo ignoramos.
			}
		}
	}
};

module.exports = {
	uploadFileInFolder
};

const { uploadFile, deleteFile, getPrivateFileUrl } = require('./bucketController');
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

const deleteFileFromFolder = async (req, res) => {
	const fileId = new ObjectId(req.params.file_id);
	const folderId = new ObjectId(req.params.folder_id);
	const userId = req.user.user_id;
	req.actions_data = {};

	try {
		const db = getDb();
		const dbFile = await db.collection("File").findOne({ _id: fileId });

	if (!dbFile) {
		return res.status(400).json({ message: `No existe el archivo con id ${fileId}.` });
	}

	const fileRelationship = await db.collection("FileRelation").findOne({
		file_id: fileId,
		collection: "Folder",
		collection_id: folderId
	});

	await db.collection("File").deleteOne({ _id: fileId });
	req.actions_data[`delete-file-${fileId}`] = {
		entity: "File",
		record_id: fileId,
		action: "delete",
		"old_dvh": null,
		"new_dvh": null
	};

	if (fileRelationship) { 
		const fileRelationId = fileRelationship._id;
		await db.collection("FileRelation").deleteOne({ _id: fileRelationId });

		req.actions_data[`delete-file-relation-${fileRelationId}`] = {
			entity: "FileRelation",
			record_id: fileRelationId,
			action: "delete",
			"old_dvh": null,
			"new_dvh": null
		};
	}

	await deleteFile("user-files", `${userId}/${folderId}/${fileId}`);
	return res.status(200).json({ message: "Se eliminó el archivo." });
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
};

const getFileUrlFromFolder = async (req, res) => {
	const fileId = req.params.file_id;
	const folderId = req.params.folder_id;
	const userId = req.user.user_id;

	try {
		const fileUrl = await getPrivateFileUrl("user-files", `${userId}/${folderId}/${fileId}`);
		return res.status(200).json({ fileUrl });
	} catch (err) {
		return res.status(400).json({ error: err.message });
	}
};

module.exports = {
	uploadFileInFolder,
	deleteFileFromFolder,
	getFileUrlFromFolder
};

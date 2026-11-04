const { uploadFile, deleteFile, getPrivateFileUrl } = require('./bucketController');
const { validateFile } = require('../utils/fileChecker');
const { getDb } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const fs = require('fs/promises');

const parseObjectId = (value) =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) ? new ObjectId(value) : null;

const getFolderForOwner = async (db, folderId, userId) => {
  if (!folderId) return null;
  return db.collection('Folder').findOne({ _id: folderId, author_id: userId });
};

const uploadFileInFolder = async (req, res) => {
  const folderId = parseObjectId(req.params.folder_id);
  const userId = req.user.user_id;
  const file = req.files?.[0];
  req.actions_data = {};

  if (!file) return res.status(400).json({ message: 'No se recibió ningún archivo.' });
  if (!folderId) return res.status(400).json({ message: 'El identificador de carpeta no es válido.' });

  const filePath = file.path;
  let objectKey;
  let fileId;
  let validationFailed = false;
  try {
    const db = getDb();
    const folder = await getFolderForOwner(db, folderId, userId);
    if (!folder) return res.status(404).json({ message: 'No se encontró una carpeta propia indicada.' });

    const originalName = String(file.originalname || '').trim();
    if (!originalName || originalName.length > 180 || /[\\/\u0000-\u001f]/.test(originalName)) {
      return res.status(400).json({ message: 'El nombre del archivo no es válido.' });
    }

    let fileType;
    try {
      fileType = await validateFile(filePath, originalName);
    } catch (validationError) {
      validationFailed = true;
      throw validationError;
    }
    const buffer = await fs.readFile(filePath);
    fileId = new ObjectId();
    objectKey = `${folder.author_id}/${folder._id}/${fileId}`;
    await uploadFile('user-files', buffer, String(fileId), fileType.mime, `${folder.author_id}/${folder._id}`);

    await db.collection('File').insertOne({
      _id: fileId,
      name: originalName,
      size: file.size / (1024 * 1024),
      mime_type: fileType.mime
    });
    const relation = await db.collection('FileRelation').insertOne({
      file_id: fileId,
      collection: 'Folder',
      collection_id: folder._id
    });
    req.actions_data['create-file'] = {
      entity: 'File',
      record_id: fileId,
      action: 'insert',
      old_dvh: null,
      new_dvh: null
    };
    req.actions_data['create-file-relation'] = {
      entity: 'FileRelation',
      record_id: relation.insertedId,
      action: 'insert',
      old_dvh: null,
      new_dvh: null
    };
    return res.status(201).json({ fileId });
  } catch (err) {
    let rollbackFailed = false;
    if (fileId) {
      try {
        const db = getDb();
        await db.collection('FileRelation').deleteMany({ file_id: fileId, collection_id: folderId });
        await db.collection('File').deleteOne({ _id: fileId });
      } catch (cleanupError) {
        rollbackFailed = true;
        console.error('No se pudieron revertir los metadatos de la carga:', cleanupError);
      }
    }
    if (objectKey) {
      try {
        await deleteFile('user-files', objectKey);
      } catch (cleanupError) {
        rollbackFailed = true;
        console.error('No se pudo revertir el objeto subido a MinIO:', cleanupError);
      }
    }
    console.error('Error al subir archivo:', err);
    const status = rollbackFailed || !validationFailed ? 500 : 400;
    const message = rollbackFailed
      ? 'La carga falló y no pudo revertirse por completo. Contactá al soporte.'
      : (validationFailed ? err.message : 'No se pudo completar la carga.');
    return res.status(status).json({ message });
  } finally {
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') console.error('No se pudo borrar el archivo temporal:', cleanupError);
    }
  }
};

const deleteFileFromFolder = async (req, res) => {
  const fileId = parseObjectId(req.params.file_id);
  const folderId = parseObjectId(req.params.folder_id);
  const userId = req.user.user_id;
  req.actions_data = {};
  if (!fileId || !folderId) return res.status(400).json({ message: 'Los identificadores indicados no son válidos.' });

  try {
    const db = getDb();
    const folder = await getFolderForOwner(db, folderId, userId);
    if (!folder) return res.status(404).json({ message: 'No se encontró una carpeta propia indicada.' });
    const relation = await db.collection('FileRelation').findOne({
      file_id: fileId,
      collection: 'Folder',
      collection_id: folderId
    });
    const file = relation ? await db.collection('File').findOne({ _id: fileId }) : null;
    if (!relation || !file) return res.status(404).json({ message: 'No se encontró el archivo en esa carpeta.' });

    await deleteFile('user-files', `${folder.author_id}/${folder._id}/${fileId}`);
    await db.collection('FileRelation').deleteOne({ _id: relation._id });
    await db.collection('File').deleteOne({ _id: fileId });
    req.actions_data[`delete-file-${fileId}`] = {
      entity: 'File',
      record_id: fileId,
      action: 'delete',
      old_dvh: null,
      new_dvh: null
    };
    req.actions_data[`delete-file-relation-${relation._id}`] = {
      entity: 'FileRelation',
      record_id: relation._id,
      action: 'delete',
      old_dvh: null,
      new_dvh: null
    };
    return res.status(200).json({ message: 'Se eliminó el archivo.' });
  } catch (err) {
    console.error('Error al eliminar archivo:', err);
    return res.status(500).json({ message: 'No se pudo eliminar el archivo.' });
  }
};

const getFileUrlFromFolder = async (req, res) => {
  const fileId = parseObjectId(req.params.file_id);
  const folderId = parseObjectId(req.params.folder_id);
  const userId = req.user.user_id;
  if (!fileId || !folderId) return res.status(400).json({ message: 'Los identificadores indicados no son válidos.' });

  try {
    const db = getDb();
    const folder = await db.collection('Folder').findOne({ _id: folderId });
    if (!folder) return res.status(404).json({ message: 'No se encontró la carpeta.' });
    if (folder.author_id !== userId && !folder.public) {
      const permission = await db.collection('FolderPermission').findOne({
        folder_id: folderId,
        user_id: userId
      });
      if (!permission) return res.status(404).json({ message: 'No se encontró una carpeta a la que tengas acceso.' });
    }

    const [file, relation] = await Promise.all([
      db.collection('File').findOne({ _id: fileId }),
      db.collection('FileRelation').findOne({
        file_id: fileId,
        collection: 'Folder',
        collection_id: folderId
      })
    ]);
    if (!file || !relation) return res.status(404).json({ message: 'No se encontró el archivo en esa carpeta.' });

    const download = req.query.download === '1' || req.query.download === 'true';
    const expiresIn = !download && /^(audio|video)\//.test(file.mime_type) ? 3600 : 300;
    const fileUrl = await getPrivateFileUrl(
      'user-files',
      `${folder.author_id}/${folder._id}/${fileId}`,
      expiresIn,
      { contentType: file.mime_type, filename: file.name, download }
    );
    return res.status(200).json({ fileUrl, expires_in: expiresIn, file });
  } catch (err) {
    console.error('Error al generar URL del archivo:', err);
    return res.status(500).json({ message: 'No se pudo obtener el archivo.' });
  }
};

module.exports = {
  uploadFileInFolder,
  deleteFileFromFolder,
  getFileUrlFromFolder
};

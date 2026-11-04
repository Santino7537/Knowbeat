const { deleteFolderAndFiles } = require('./bucketController');
const { getDb } = require('../config/mongodb');
const sqlDb = require('../config/db');
const { ObjectId } = require('mongodb');

const PAGE_LIMIT = 50;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || 20;
  const limit = Math.min(PAGE_LIMIT, Math.max(1, requestedLimit));
  return { page, limit, skip: (page - 1) * limit };
};

const parseObjectId = (value) =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) ? new ObjectId(value) : null;

const getFolderAccess = async (db, folderId, userId) => {
  const folder = await db.collection('Folder').findOne({ _id: folderId });
  if (!folder) return { folder: null, isOwner: false, isShared: false };

  const isOwner = folder.author_id === userId;
  const isShared = !isOwner && Boolean(await db.collection('FolderPermission').findOne({
    folder_id: folderId,
    user_id: userId
  }));
  return { folder, isOwner, isShared };
};

const createFolder = async (req, res) => {
  const folderName = String(req.params.folder_name || '').trim();
  const userId = req.user.user_id;
  req.actions_data = {};

  if (!folderName || folderName.length > 120 || /[\u0000-\u001f]/.test(folderName)) {
    return res.status(400).json({ message: 'El nombre debe tener entre 1 y 120 caracteres.' });
  }

  try {
    const db = getDb();
    const result = await db.collection('Folder').insertOne({
      author_id: userId,
      name: folderName,
      public: false
    });

    req.actions_data['create-folder'] = {
      entity: 'Folder',
      record_id: result.insertedId,
      action: 'insert',
      old_dvh: null,
      new_dvh: null
    };

    return res.status(201).json({ folderId: result.insertedId });
  } catch (err) {
    console.error('Error al crear carpeta:', err);
    return res.status(500).json({ message: 'No se pudo crear la carpeta.' });
  }
};

const updateFolder = async (req, res) => {
  const { isPublic } = req.body;
  const newName = req.body.name ?? req.body.newFolderName;
  const userId = req.user.user_id;
  req.actions_data = {};

  if ((typeof isPublic !== 'boolean') && (typeof newName !== 'string' || !newName.trim())) {
    return res.status(400).json({ message: 'Indicá un nombre o la visibilidad que querés actualizar.' });
  }
  if (newName != null && (newName.trim().length > 120 || /[\u0000-\u001f]/.test(newName))) {
    return res.status(400).json({ message: 'El nombre debe tener entre 1 y 120 caracteres.' });
  }

  try {
    const db = getDb();
    const filter = { author_id: userId };
    const folderId = parseObjectId(req.body.folder_id);
    if (folderId) {
      filter._id = folderId;
    } else if (typeof req.body.oldFolderName === 'string') {
      filter.name = req.body.oldFolderName;
    } else {
      return res.status(400).json({ message: 'Indicá la carpeta que querés actualizar.' });
    }

    const updateFields = {};
    if (typeof isPublic === 'boolean') updateFields.public = isPublic;
    if (typeof newName === 'string' && newName.trim()) updateFields.name = newName.trim();
    const result = await db.collection('Folder').findOneAndUpdate(
      filter,
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ message: 'No se encontró la carpeta propia indicada.' });

    req.actions_data['update-folder'] = {
      entity: 'Folder',
      record_id: result._id,
      action: 'update',
      old_dvh: null,
      new_dvh: null
    };
    return res.status(200).json({ message: 'Se actualizó la carpeta.' });
  } catch (err) {
    console.error('Error al actualizar carpeta:', err);
    return res.status(500).json({ message: 'No se pudo actualizar la carpeta.' });
  }
};

const deleteFolder = async (req, res) => {
  const folderId = parseObjectId(req.params.folder_name);
  const folderName = req.params.folder_name;
  const userId = req.user.user_id;
  req.actions_data = {};

  try {
    const db = getDb();
    const filter = { author_id: userId };
    if (folderId) filter._id = folderId;
    else filter.name = folderName;
    const folder = await db.collection('Folder').findOne(filter);
    if (!folder) return res.status(404).json({ message: 'No se encontró la carpeta propia indicada.' });

    const relations = await db.collection('FileRelation').find({
      collection: 'Folder',
      collection_id: folder._id
    }).toArray();
    const fileIds = relations.map((relation) => relation.file_id);
    const prefix = `${folder.author_id}/${folder._id}/`;

    await deleteFolderAndFiles('user-files', prefix);
    if (relations.length) {
      await db.collection('FileRelation').deleteMany({ _id: { $in: relations.map((row) => row._id) } });
      await db.collection('File').deleteMany({ _id: { $in: fileIds } });
    }

    const permissions = await db.collection('FolderPermission').find({ folder_id: folder._id }).toArray();
    if (permissions.length) {
      await db.collection('FolderPermission').deleteMany({ folder_id: folder._id });
    }
    await db.collection('Folder').deleteOne({ _id: folder._id });

    for (const relation of relations) {
      req.actions_data[`delete-file-relation-${relation._id}`] = {
        entity: 'FileRelation',
        record_id: relation._id,
        action: 'delete',
        old_dvh: null,
        new_dvh: null
      };
    }
    for (const fileId of fileIds) {
      req.actions_data[`delete-file-${fileId}`] = {
        entity: 'File',
        record_id: fileId,
        action: 'delete',
        old_dvh: null,
        new_dvh: null
      };
    }
    for (const permission of permissions) {
      req.actions_data[`delete-folder-permission-${permission._id}`] = {
        entity: 'FolderPermission',
        record_id: permission._id,
        action: 'delete',
        old_dvh: null,
        new_dvh: null
      };
    }
    req.actions_data['delete-folder'] = {
      entity: 'Folder',
      record_id: folder._id,
      action: 'delete',
      old_dvh: null,
      new_dvh: null
    };
    return res.status(200).json({ message: 'Se eliminó la carpeta y su contenido.' });
  } catch (err) {
    console.error('Error al eliminar carpeta:', err);
    return res.status(500).json({ message: 'No se pudo eliminar la carpeta completa.' });
  }
};

const getFolders = async (req, res) => {
  const userId = req.user.user_id;
  const scope = String(req.query.scope || 'all');
  const query = String(req.query.query || '').trim().slice(0, 120);
  const pagination = parsePagination(req.query);
  if (!['all', 'mine', 'public', 'shared'].includes(scope)) {
    return res.status(400).json({ message: 'El filtro de carpetas no es válido.' });
  }

  try {
    const db = getDb();
    const permissions = await db.collection('FolderPermission').find({ user_id: userId }).project({ folder_id: 1 }).toArray();
    const sharedIds = permissions.map((permission) => permission.folder_id);
    let scopeFilter;
    if (scope === 'mine') scopeFilter = { author_id: userId };
    if (scope === 'public') scopeFilter = { public: true, author_id: { $ne: userId } };
    if (scope === 'shared') scopeFilter = { _id: { $in: sharedIds }, author_id: { $ne: userId } };
    if (scope === 'all') {
      scopeFilter = {
        $or: [
          { author_id: userId },
          { public: true },
          { _id: { $in: sharedIds } }
        ]
      };
    }
    const filter = { ...scopeFilter };
    if (query) filter.name = { $regex: escapeRegex(query), $options: 'i' };

    const [folders, total] = await Promise.all([
      db.collection('Folder').find(filter).sort({ name: 1, _id: 1 })
        .skip(pagination.skip).limit(pagination.limit).toArray(),
      db.collection('Folder').countDocuments(filter)
    ]);

    const folderIds = folders.map((folder) => folder._id);
    const counts = folderIds.length
      ? await db.collection('FileRelation').aggregate([
        { $match: { collection: 'Folder', collection_id: { $in: folderIds } } },
        { $lookup: { from: 'File', localField: 'file_id', foreignField: '_id', as: 'file' } },
        { $match: { 'file.0': { $exists: true } } },
        { $group: { _id: '$collection_id', count: { $sum: 1 } } }
      ]).toArray()
      : [];
    const countByFolder = new Map(counts.map((row) => [String(row._id), row.count]));
    const sharedIdSet = new Set(sharedIds.map(String));
    const ownerIds = [...new Set(folders.map((folder) => folder.author_id).filter(Number.isSafeInteger))];
    let owners = [];
    if (ownerIds.length) {
      const placeholders = ownerIds.map(() => '?').join(', ');
      const [rows] = await sqlDb.query(
        `SELECT id, username FROM User WHERE id IN (${placeholders})`,
        ownerIds
      );
      owners = rows;
    }
    const ownerById = new Map(owners.map((owner) => [owner.id, owner.username]));

    const ownFolderIds = await db.collection('Folder')
      .find({ author_id: userId }).project({ _id: 1 }).toArray();
    const storage = ownFolderIds.length
      ? await db.collection('FileRelation').aggregate([
        { $match: { collection: 'Folder', collection_id: { $in: ownFolderIds.map((folder) => folder._id) } } },
        { $group: { _id: '$file_id' } },
        { $lookup: { from: 'File', localField: '_id', foreignField: '_id', as: 'file' } },
        { $unwind: '$file' },
        { $group: { _id: null, size: { $sum: '$file.size' } } }
      ]).toArray()
      : [];

    return res.status(200).json({
      data: folders.map((folder) => ({
        id: folder._id,
        name: folder.name,
        public: Boolean(folder.public),
        owner_id: folder.author_id,
        owner_name: ownerById.get(folder.author_id) || null,
        is_owner: folder.author_id === userId,
        access: folder.author_id === userId ? 'owner' : (sharedIdSet.has(String(folder._id)) ? 'shared' : 'public'),
        file_count: countByFolder.get(String(folder._id)) || 0
      })),
      pagination: { page: pagination.page, limit: pagination.limit, total },
      storage_used_mb: Number((storage[0]?.size || 0).toFixed(2))
    });
  } catch (err) {
    console.error('Error al listar carpetas:', err);
    return res.status(500).json({ message: 'No se pudieron cargar las carpetas.' });
  }
};

const getFolderFiles = async (req, res) => {
  let folderId = parseObjectId(req.params.folder_name);
  const userId = req.user.user_id;
  const query = String(req.query.query || '').trim().slice(0, 120);
  const type = String(req.query.type || '');
  const sortBy = String(req.query.sort || 'name');
  const pagination = parsePagination(req.query);
  const mimeTypes = {
    documents: ['application/pdf', 'text/plain'],
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg'],
    video: ['video/mp4', 'video/webm']
  };
  if (type && !mimeTypes[type] && type !== 'other') {
    return res.status(400).json({ message: 'El filtro de tipo de archivo no es válido.' });
  }
  if (!['name', 'size'].includes(sortBy)) {
    return res.status(400).json({ message: 'El orden de archivos no es válido.' });
  }

  try {
    const db = getDb();
    if (!folderId) {
      const legacyFolder = await db.collection('Folder').findOne({
        author_id: userId,
        name: req.params.folder_name
      });
      if (!legacyFolder) return res.status(400).json({ message: `No existe la carpeta ${req.params.folder_name}.` });
      folderId = legacyFolder._id;
    }
    const access = await getFolderAccess(db, folderId, userId);
    if (!access.folder || (!access.isOwner && !access.isShared && !access.folder.public)) {
      return res.status(404).json({ message: 'No se encontró una carpeta a la que tengas acceso.' });
    }

    const fileFilter = {};
    if (query) fileFilter.name = { $regex: escapeRegex(query), $options: 'i' };
    if (mimeTypes[type]) fileFilter.mime_type = { $in: mimeTypes[type] };
    if (type === 'other') {
      fileFilter.mime_type = { $nin: Object.values(mimeTypes).flat() };
    }
    const result = await db.collection('FileRelation').aggregate([
      { $match: { collection: 'Folder', collection_id: folderId } },
      { $lookup: { from: 'File', localField: 'file_id', foreignField: '_id', as: 'file' } },
      { $unwind: '$file' },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$file', { relation_id: '$_id' }] } } },
      { $match: fileFilter },
      { $sort: sortBy === 'size' ? { size: 1, name: 1, _id: 1 } : { name: 1, _id: 1 } },
      { $facet: {
        data: [{ $skip: pagination.skip }, { $limit: pagination.limit }],
        total: [{ $count: 'count' }]
      } }
    ]).toArray();
    const files = result[0]?.data || [];
    const total = result[0]?.total[0]?.count || 0;
    const [ownerRows] = await sqlDb.query('SELECT username FROM User WHERE id = ? LIMIT 1', [access.folder.author_id]);

    return res.status(200).json({
      folder: {
        id: access.folder._id,
        name: access.folder.name,
        public: Boolean(access.folder.public),
        owner_id: access.folder.author_id,
        owner_name: ownerRows[0]?.username || null,
        can_write: access.isOwner
      },
      files: files.map((file) => ({
        id: file._id,
        name: file.name,
        size: file.size,
        mime_type: file.mime_type
      })),
      pagination: { page: pagination.page, limit: pagination.limit, total }
    });
  } catch (err) {
    console.error('Error al listar archivos de carpeta:', err);
    return res.status(500).json({ message: 'No se pudieron cargar los archivos.' });
  }
};

const shareFolder = async (req, res) => {
  const folderId = parseObjectId(req.params.folder_id);
  const username = String(req.body.username || '').trim();
  req.actions_data = {};
  if (!folderId || !username) return res.status(400).json({ message: 'Indicá la carpeta y el usuario.' });

  try {
    const db = getDb();
    const folder = await db.collection('Folder').findOne({ _id: folderId, author_id: req.user.user_id });
    if (!folder) return res.status(404).json({ message: 'No se encontró una carpeta propia indicada.' });
    const [users] = await sqlDb.query(
      'SELECT id FROM User WHERE username = ? AND eliminated = 0 LIMIT 1',
      [username]
    );
    const target = users[0];
    if (!target) return res.status(404).json({ message: 'No se encontró ese usuario.' });
    if (target.id === req.user.user_id) return res.status(400).json({ message: 'No podés compartir una carpeta con vos mismo.' });

    const collection = db.collection('FolderPermission');
    const existing = await collection.findOne({ folder_id: folderId, user_id: target.id });
    if (!existing) {
      const permission = await collection.insertOne({ folder_id: folderId, user_id: target.id });
      req.actions_data['share-folder'] = {
        entity: 'FolderPermission',
        record_id: permission.insertedId,
        action: 'insert',
        old_dvh: null,
        new_dvh: null
      };
    }
    return res.status(existing ? 200 : 201).json({ message: 'La carpeta se compartió con permiso de solo lectura.' });
  } catch (err) {
    console.error('Error al compartir carpeta:', err);
    return res.status(500).json({ message: 'No se pudo compartir la carpeta.' });
  }
};

const unshareFolder = async (req, res) => {
  const folderId = parseObjectId(req.params.folder_id);
  const target = String(req.params.user_id || '').trim();
  const numericTarget = Number(target);
  req.actions_data = {};
  if (!folderId || !target) {
    return res.status(400).json({ message: 'Los identificadores indicados no son válidos.' });
  }

  try {
    const db = getDb();
    const folder = await db.collection('Folder').findOne({ _id: folderId, author_id: req.user.user_id });
    if (!folder) return res.status(404).json({ message: 'No se encontró una carpeta propia indicada.' });
    let targetId = Number.isSafeInteger(numericTarget) && numericTarget > 0 ? numericTarget : null;
    if (!targetId) {
      const [users] = await sqlDb.query(
        'SELECT id FROM User WHERE username = ? AND eliminated = 0 LIMIT 1',
        [target]
      );
      targetId = users[0]?.id;
    }
    if (!targetId) return res.status(404).json({ message: 'No se encontró ese usuario.' });
    const result = await db.collection('FolderPermission').findOneAndDelete({
      folder_id: folderId,
      user_id: targetId
    });
    if (result) {
      req.actions_data['unshare-folder'] = {
        entity: 'FolderPermission',
        record_id: result._id,
        action: 'delete',
        old_dvh: null,
        new_dvh: null
      };
    }
    return res.status(200).json({ message: 'Se quitó el acceso compartido.' });
  } catch (err) {
    console.error('Error al quitar acceso compartido:', err);
    return res.status(500).json({ message: 'No se pudo quitar el acceso compartido.' });
  }
};

module.exports = {
  createFolder,
  updateFolder,
  deleteFolder,
  getFolders,
  getFolderFiles,
  shareFolder,
  unshareFolder
};

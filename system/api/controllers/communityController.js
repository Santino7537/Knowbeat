const { getDb } = require('../config/dbdb');
const db = require('../config/db');
const { getPublicFileUrl } = require('./bucketController');

const MAX_LIMIT = 50;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePagination = (query) => {
    const { page, limit } = query;
    if (!page || limit === null) {
		return res.status(422).json({ message: 'Los parámetros de página o límite son inválidos' });
	}

	const page = Number.parseInt(page || '1', 10);
	const limit = Number.parseInt(limit || '20', 10);

	if (page < 1 || limit < 1 || limit > MAX_LIMIT) {
		return res.status(400).json({ message: 'Los parámetros de página o límite son inválidos' });
	}

	return { page, limit, skip: (page - 1) * limit };
};

const searchFolders = async (req, res) => {
	const pagination = parsePagination(req.query);
	const query = String(req.query.query ?? '').trim();

	try {
		const db = getDb();
		const filter = { public: true };
		if (query) filter.name = { $regex: escapeRegex(query), $options: 'i' };

		const [folders, total] = await Promise.all([
			db.collection('Folder').find(filter).sort({ name: 1 }).skip(pagination.skip).limit(pagination.limit).toArray(),
			db.collection('Folder').countDocuments(filter)
		]);

		return res.status(200).json({
			data: folders.map(folder => ({
				id: folder._id,
				name: folder.name,
				public: folder.public,
				author: folder.author_id
			})),
			pagination: { page: pagination.page, limit: pagination.limit, total }
		});
	} catch (error) {
		console.error('Error al buscar carpetas:', error);
		return res.status(500).json({ message: 'Error al buscar carpetas' });
	}
};

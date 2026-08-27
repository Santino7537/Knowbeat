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

const searchUsers = async (req, res) => {
	const pagination = parsePagination(req);
	const query = String(req.query.query ?? req.query.q ?? '').trim();

	try {
		const conditions = ['eliminated = 0'];
		const params = [];
		if (query) {
			conditions.push('username LIKE ?');
			params.push(`%${query}%`);
		}
		const where = conditions.join(' AND ');
		const [users] = await db.query(
			`SELECT id, username, picture FROM User WHERE ${where} ORDER BY username ASC LIMIT ? OFFSET ?`,
			[...params, pagination.limit, pagination.skip]
		);
		const [count] = await db.query(`SELECT COUNT(*) AS total FROM User WHERE ${where}`, params);

		return res.status(200).json({
			data: users.map(user => ({ ...user, picture: getPublicFileUrl('profiles', user.picture) })),
			pagination: { page: pagination.page, limit: pagination.limit, total: Number(count[0].total) }
		});
	} catch (error) {
		console.error('Error al buscar usuarios:', error);
		return res.status(500).json({ message: 'Error al buscar usuarios' });
	}
};

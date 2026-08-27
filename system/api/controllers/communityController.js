const { getDb } = require('../config/dbdb');
const db = require('../config/db');
const { getPublicFileUrl } = require('./bucketController');

const MAX_LIMIT = 50;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePagination = (query) => {
    let { page, limit } = query;
    if (!page || limit === null) {
		return res.status(422).json({ message: 'Los parámetros de página o límite son inválidos' });
	}

	page = Number.parseInt(page || '1', 10);
	limit = Number.parseInt(limit || '20', 10);

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

const searchThreads = async (req, res) => {
	const pagination = parsePagination(req);
	const query = String(req.query.query ?? req.query.q ?? '').trim();
	const tags = String(req.query.tags ?? '').trim();

	try {
		const db = getDb();
		const filter = {};
		if (query) {
			const expression = { $regex: escapeRegex(query), $options: 'i' };
			filter.$or = [{ title: expression }, { text: expression }];
		}
		if (tags) filter.tags = { $elemMatch: { $regex: `^${escapeRegex(tags)}$`, $options: 'i' } };

		const order = { likes_count: -1, created_at: -1 };
		const [threads, total] = await Promise.all([
			db.collection('Thread').find(filter).sort(order).skip(pagination.skip).limit(pagination.limit).toArray(),
			db.collection('Thread').countDocuments(filter)
		]);

		return res.status(200).json({
			data: threads.map(thread => ({ ...thread, id: thread._id })),
			pagination: { page: pagination.page, limit: pagination.limit, total }
		});
	} catch (error) {
		console.error('Error al buscar hilos:', error);
		return res.status(500).json({ message: 'Error al buscar hilos' });
	}
};

const runSearch = (controller, request) => new Promise((resolve, reject) => {
    const response = {
        status: statusCode => ({ json: body => statusCode >= 400 ? reject(new Error(body.message)) : resolve(body) }),
        json: resolve
    };
    controller(request, response).catch(reject);
});

const searchCommunity = async (req, res) => {
	const query = String(req.query.query ?? req.query.q ?? '').trim();
	const tags = String(req.query.tags ?? '').trim();
	const types = String(req.query.types ?? 'folders,users,threads')
		.split(',')
		.map(type => type.trim().toLowerCase())
		.filter(Boolean);
	const allowedTypes = ['folders', 'users', 'threads'];

	if (types.length === 0 || types.some(type => !allowedTypes.includes(type))) {
		return res.status(422).json({ message: 'Los tipos de búsqueda son inválidos' });
	}

	try {
		const searches = [];
		if (types.includes('folders')) searches.push(runSearch(searchFolders, { req: { query: { query, tags } } }).then(data => ['folders', data]));
		if (types.includes('users')) searches.push(runSearch(searchUsers, { req: { query: { query, tags } } }).then(data => ['users', data]));
		if (types.includes('threads')) searches.push(runSearch(searchThreads, { req: { query: { query, tags } } }).then(data => ['threads', data]));

		const result = Object.fromEntries(await Promise.all(searches));

		return res.status(200).json(result);
	} catch (error) {
		console.error('Error en la búsqueda de comunidad:', error);
		return res.status(500).json({ message: 'Error en la búsqueda de comunidad' });
	}
};

const createThread = async (req, res) => {
  const { title, text, tags } = req.body;
  const userId = req.user.user_id;

  if (!title || !text || !tags || !Array.isArray(tags) || tags.length === 0) {
    return res.status(400).json({ message: 'Título, contenido o etiquetas faltantes' });
  }

  req.actions_data = {};

  try {
    const db = getDb();
    const result = await db.collection("Thread").insertOne({
      author_id: userId,
      title,
	  text,
	  tags,
    });

    const threadId = result.insertedId;

    req.actions_data["create-thread"] = {
      entity: "Thread",
      record_id: threadId,
      action: "insert",
      "old_dvh": null,
      "new_dvh": null
    };

    return res.status(201).json({ threadId });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = { searchCommunity, createThread };

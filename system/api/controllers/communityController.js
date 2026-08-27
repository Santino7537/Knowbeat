const { getDb } = require('../config/dbdb');
const db = require('../config/db');
const { ObjectId } = require('mongodb');
const { getPublicFileUrl } = require('./bucketController');

const MAX_LIMIT = 50;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePagination = (query) => {
    let { page, limit } = query;

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

const searchThread = async (req, res) => {
	const threadId = req.params.thread_id;

	try {
		const db = getDb();
		const thread = await db.collection('Thread').findOne({ _id: new ObjectId(threadId) });

		if (!thread) {
			return res.status(404).json({ message: 'Hilo no encontrado' });
		}
		
		return res.status(200).json({ data: { ...thread, id: thread._id } });
	} catch (error) {
		console.error('Error al buscar hilo:', error);
		return res.status(500).json({ message: 'Error al buscar hilo' });
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
	  likes_count: 0,
	  created_at: new Date(),
    });

    const threadId = result.insertedId;

	const existingTags = await searchTags();
	const newTags = tags.filter(tag => !existingTags.some(existingTag => existingTag.name.toLowerCase() === tag.toLowerCase()));
	
	newTags.forEach(async tag => {
		await createTag(tag);
	});

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

const createResponse = async (req, res) => {
	const { text } = req.body;
	const threadId = req.params.thread_id;
	const userId = req.user.user_id;

	if (!text || !text.trim()) {
		return res.status(400).json({ message: 'El contenido de la respuesta es obligatorio' });
	}

	if (!ObjectId.isValid(threadId)) {
		return res.status(400).json({ message: 'La id del hilo es inválida' });
	}

	req.actions_data = {};

	try {
		const db = getDb();
		const threadObjectId = new ObjectId(threadId);
		const thread = await db.collection('Thread').findOne({ _id: threadObjectId });

		if (!thread) {
			return res.status(404).json({ message: 'Hilo no encontrado' });
		}

		const result = await db.collection('Response').insertOne({
			thread_id: threadObjectId,
			author_id: userId,
			text: text.trim(),
			likes_count: 0,
			created_at: new Date()
		});

		req.actions_data["create-response"] = {
			entity: "Response",
			record_id: result.insertedId,
			action: "insert",
			"old_dvh": null,
			"new_dvh": null
		};

		return res.status(201).json({ responseId: result.insertedId });
	} catch (error) {
		console.error('Error al crear respuesta:', error);
		return res.status(500).json({ message: 'Error al crear respuesta' });
	}
};

const searchResponses = async (req, res) => {
	const threadId = req.params.thread_id;
	const pagination = parsePagination(req.query);

	if (!ObjectId.isValid(threadId)) {
		return res.status(400).json({ message: 'La id del hilo es inválida' });
	}

	try {
		const db = getDb();
		const filter = { thread_id: new ObjectId(threadId) };
		const [responses, total] = await Promise.all([
			db.collection('Response').find(filter)
				.sort({ created_at: 1 })
				.skip(pagination.skip)
				.limit(pagination.limit)
				.toArray(),
			db.collection('Response').countDocuments(filter)
		]);

		return res.status(200).json({
			data: responses.map(response => ({ ...response, id: response._id })),
			pagination: { page: pagination.page, limit: pagination.limit, total }
		});
	} catch (error) {
		console.error('Error al buscar respuestas del hilo:', error);
		return res.status(500).json({ message: 'Error al buscar respuestas del hilo' });
	}
};

const searchTags = async () => {
	const db = getDb();

	return db.collection('Tag').find({}).sort({ name: 1 }).toArray();
};

const createTag = async (name) => {
	if (typeof name !== 'string' || !name.trim()) {
		throw new TypeError('El nombre de la etiqueta es obligatorio');
	}

	req.actions_data = {};

	const normalizedName = name.trim();
	const db = getDb();
	const existingTag = await db.collection('Tag').findOne({
		name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' }
	});

	if (existingTag) {
		return existingTag;
	}

	const result = await db.collection('Tag').insertOne({ name: normalizedName });

	req.actions_data["create-tag"] = {
		entity: "Tag",
		record_id: result.insertedId,
		action: "insert",
		"old_dvh": null,
		"new_dvh": null
	};

	return { _id: result.insertedId, name: normalizedName };
};

module.exports = { searchCommunity, searchThread, createThread, createResponse, searchResponses };

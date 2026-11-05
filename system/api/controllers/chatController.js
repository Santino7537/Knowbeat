const { getDb } = require('../config/mongodb');
const db = require('../config/db');
const { getIo } = require('../config/socket');

const MAX_MESSAGES_LIMIT = 50;

const sanitizeText = (value, maxLength = 4000) => {
  if (typeof value !== 'string') return null;
  const sanitized = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return sanitized.length > 0 && sanitized.length <= maxLength ? sanitized : null;
};

const validateFriendshipAccess = async (userId, friendshipId) => {
  const [rows] = await db.query(
    'SELECT id FROM Friendship WHERE id = ? AND (user1 = ? OR user2 = ?)',
    [friendshipId, userId, userId]
  );

  return rows.length > 0;
};

const getMessages = async (req, res) => {
  const userId = req.user.user_id;
  const friendshipId = Number(req.params.friendship_id);
  const before = req.query.before ? new Date(req.query.before) : null;
  const limit = Number(req.query.limit || '30');

  if (!Number.isSafeInteger(friendshipId) || friendshipId <= 0) {
    return res.status(400).json({ error: 'El ID de la amistad no es válido' });
  }

  if (!Number.isInteger(limit) || limit <= 0 || limit > MAX_MESSAGES_LIMIT) {
    return res.status(422).json({ error: 'El límite debe ser un entero entre 1 y 50' });
  }

  const allowed = await validateFriendshipAccess(userId, friendshipId);
  if (!allowed) {
    return res.status(403).json({ error: 'No tienes acceso a este chat' });
  }

  try {
    const filter = { friendship_id: friendshipId };
    if (before && !Number.isNaN(before.getTime())) {
      filter.created_at = { $lt: before };
    }

    const messages = await getDb()
      .collection('Message')
      .find(filter)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit)
      .toArray();

    const orderedMessages = [...messages].reverse().map((message) => ({
      id: message._id,
      author_id: message.author_id,
      text: message.text,
      seen: Boolean(message.seen),
      friendship_id: message.friendship_id,
      created_at: message.created_at
    }));

    return res.status(200).json({
      data: orderedMessages,
      pagination: {
        limit,
        before: before ? before.toISOString() : null
      }
    });
  } catch (error) {
    console.error('Error al obtener mensajes del chat:', error);
    return res.status(500).json({ error: 'Error al obtener mensajes del chat' });
  }
};

const sendMessage = async (req, res) => {
  const userId = req.user.user_id;
  const { friendship_id: rawFriendshipId, text } = req.body;
  const friendshipId = Number(rawFriendshipId);

  if (!Number.isSafeInteger(friendshipId) || friendshipId <= 0) {
    return res.status(400).json({ error: 'El ID de la amistad no es válido' });
  }

  const cleanText = sanitizeText(text, 4000);
  if (!cleanText) {
    return res.status(400).json({ error: 'El texto del mensaje es obligatorio' });
  }

  const allowed = await validateFriendshipAccess(userId, friendshipId);
  if (!allowed) {
    return res.status(403).json({ error: 'No tienes acceso a este chat' });
  }

  try {
    const message = {
      author_id: userId,
      text: cleanText,
      created_at: new Date(),
      seen: false,
      friendship_id: friendshipId
    };

    const mongo = getDb();
    const result = await mongo.collection('Message').insertOne(message);
    const payload = {
      id: result.insertedId,
      author_id: userId,
      text: cleanText,
      seen: false,
      friendship_id: friendshipId,
      created_at: message.created_at
    };

    const io = getIo();
    if (io) {
      io.to(`chat:${friendshipId}`).emit('chat:message', payload);
    }

    return res.status(201).json({ message: payload });
  } catch (error) {
    console.error('Error al enviar mensaje del chat:', error);
    return res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
};

const markMessagesAsRead = async (req, res) => {
  const userId = req.user.user_id;
  const friendshipId = Number(req.params.friendship_id);

  if (!Number.isSafeInteger(friendshipId) || friendshipId <= 0) {
    return res.status(400).json({ error: 'El ID de la amistad no es válido' });
  }

  const allowed = await validateFriendshipAccess(userId, friendshipId);
  if (!allowed) {
    return res.status(403).json({ error: 'No tienes acceso a este chat' });
  }

  try {
    const mongo = getDb();
    const result = await mongo.collection('Message').updateMany(
      { friendship_id: friendshipId, author_id: { $ne: userId }, seen: false },
      { $set: { seen: true } }
    );

    const io = getIo();
    if (io) {
      io.to(`chat:${friendshipId}`).emit('chat:read', {
        friendship_id: friendshipId,
        user_id: userId,
        updated_count: result.modifiedCount
      });
    }

    return res.status(200).json({
      message: 'Mensajes marcados como leídos',
      updated_count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    return res.status(500).json({ error: 'Error al marcar mensajes como leídos' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessagesAsRead
};

const db = require('../config/db');
const { getPublicFileUrl } = require('./bucketController');

const parsePositiveId = value => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const getOrderedUserIds = (first, second) =>
  first < second ? [first, second] : [second, first];

const getFriendshipRequests = async (req, res) => {
  const userId = req.user.user_id;
  req.actions_data = {};

  try {
    const [rows] = await db.query(`
      SELECT
        fr.id,
        fr.sender_id,
        fr.receiver_id,
        fr.created_at,
        sender.username AS sender_username,
        sender.picture AS sender_picture,
        receiver.username AS receiver_username,
        receiver.picture AS receiver_picture
      FROM FriendshipRequest fr
      JOIN User sender ON sender.id = fr.sender_id
      JOIN User receiver ON receiver.id = fr.receiver_id
      WHERE fr.status = 'PENDING'
        AND (fr.sender_id = ? OR fr.receiver_id = ?)
      ORDER BY fr.created_at DESC, fr.id DESC
    `, [userId, userId]);

    return res.status(200).json({
      incoming: rows
        .filter(row => row.receiver_id === userId)
        .map(row => ({
          id: row.id,
          created_at: row.created_at,
          user: {
            id: row.sender_id,
            username: row.sender_username,
            picture: getPublicFileUrl('profiles', row.sender_picture)
          }
        })),
      outgoing: rows
        .filter(row => row.sender_id === userId)
        .map(row => ({
          id: row.id,
          created_at: row.created_at,
          user: {
            id: row.receiver_id,
            username: row.receiver_username,
            picture: getPublicFileUrl('profiles', row.receiver_picture)
          }
        }))
    });
  } catch (error) {
    console.error('Error al obtener solicitudes de amistad:', error);
    return res.status(500).json({ error: 'Error al obtener solicitudes de amistad' });
  }
};

const getFriends = async (req, res) => {
  const userId = req.user.user_id;
  req.actions_data = {};

  try {
    const [rows] = await db.query(`
      SELECT
        f.id AS friendship_id,
        u.id AS user_id,
        u.username,
        u.picture
      FROM Friendship f
      JOIN User u
        ON u.id = CASE WHEN f.user1 = ? THEN f.user2 ELSE f.user1 END
      WHERE (f.user1 = ? OR f.user2 = ?)
        AND u.eliminated = 0
      ORDER BY u.username ASC
    `, [userId, userId, userId]);

    return res.status(200).json(rows.map(row => ({
      friendship_id: row.friendship_id,
      id: row.user_id,
      username: row.username,
      picture: getPublicFileUrl('profiles', row.picture)
    })));
  } catch (error) {
    console.error('Error al obtener amistades:', error);
    return res.status(500).json({ error: 'Error al obtener amistades' });
  }
};

const sendFriendRequest = async (req, res) => {
  const senderId = req.user.user_id;
  const receiverId = parsePositiveId(req.params.user_id);
  req.actions_data = {};

  if (!receiverId) {
    return res.status(400).json({ error: 'El ID del usuario no es válido' });
  }
  if (senderId === receiverId) {
    return res.status(400).json({ error: 'No puedes enviarte una solicitud a ti mismo' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.query(
      'SELECT id, eliminated FROM User WHERE id IN (?, ?) ORDER BY id FOR UPDATE',
      [senderId, receiverId]
    );
    if (users.length !== 2 || users.some(user => user.eliminated !== 0)) {
      await connection.rollback();
      return res.status(404).json({ error: 'El usuario no existe' });
    }

    const [user1, user2] = getOrderedUserIds(senderId, receiverId);
    const [friendships] = await connection.query(
      'SELECT id FROM Friendship WHERE user1 = ? AND user2 = ? LIMIT 1',
      [user1, user2]
    );
    if (friendships.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Ya son amigos' });
    }

    const [requests] = await connection.query(`
      SELECT id, sender_id, receiver_id
      FROM FriendshipRequest
      WHERE status = 'PENDING'
        AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
      LIMIT 1
      FOR UPDATE
    `, [senderId, receiverId, receiverId, senderId]);

    if (requests.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        error: requests[0].sender_id === receiverId
          ? 'Este usuario ya te envió una solicitud'
          : 'Ya existe una solicitud pendiente'
      });
    }

    const [result] = await connection.query(
      'INSERT INTO FriendshipRequest (sender_id, receiver_id) VALUES (?, ?)',
      [senderId, receiverId]
    );
    await connection.commit();

    req.actions_data['friend-request'] = {
      entity: 'FriendshipRequest',
      record_id: result.insertId,
      action: 'insert'
    };

    return res.status(201).json({ request_id: result.insertId });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al enviar solicitud de amistad:', error);
    return res.status(500).json({ error: 'Error al enviar solicitud de amistad' });
  } finally {
    connection?.release();
  }
};

const resolveFriendRequest = (resolution) => async (req, res) => {
  const userId = req.user.user_id;
  const requestId = parsePositiveId(req.params.request_id);
  req.actions_data = {};

  if (!requestId) {
    return res.status(400).json({ error: 'El ID de la solicitud no es válido' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [requests] = await connection.query(
      'SELECT * FROM FriendshipRequest WHERE id = ? FOR UPDATE',
      [requestId]
    );
    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Solicitud de amistad no encontrada' });
    }

    const request = requests[0];
    if (request.status !== 'PENDING') {
      await connection.rollback();
      return res.status(409).json({ error: 'La solicitud ya fue resuelta' });
    }

    const isRecipient = request.receiver_id === userId;
    const isSender = request.sender_id === userId;
    if (resolution === 'CANCELLED' ? !isSender : !isRecipient) {
      await connection.rollback();
      return res.status(403).json({
        error: resolution === 'CANCELLED'
          ? 'Solo quien envió la solicitud puede cancelarla'
          : 'Solo quien recibió la solicitud puede resolverla'
      });
    }

    let friendshipId;
    if (resolution === 'ACCEPTED') {
      const [user1, user2] = getOrderedUserIds(request.sender_id, request.receiver_id);
      const [friendships] = await connection.query(
        'SELECT id FROM Friendship WHERE user1 = ? AND user2 = ? FOR UPDATE',
        [user1, user2]
      );
      if (friendships.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Ya son amigos' });
      }

      const [friendship] = await connection.query(
        'INSERT INTO Friendship (user1, user2) VALUES (?, ?)',
        [user1, user2]
      );
      friendshipId = friendship.insertId;
    }

    await connection.query(
      'UPDATE FriendshipRequest SET status = ?, resolved_at = NOW() WHERE id = ?',
      [resolution, requestId]
    );
    await connection.commit();

    req.actions_data[`friend-${resolution.toLowerCase()}`] = {
      entity: resolution === 'ACCEPTED' ? 'Friendship' : 'FriendshipRequest',
      record_id: friendshipId ?? requestId,
      action: resolution.toLowerCase()
    };

    return res.status(200).json({
      message: resolution === 'ACCEPTED'
        ? 'Solicitud aceptada'
        : resolution === 'REJECTED' ? 'Solicitud rechazada' : 'Solicitud cancelada',
      ...(friendshipId ? { friendship_id: friendshipId } : {})
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al resolver solicitud de amistad:', error);
    return res.status(500).json({ error: 'Error al resolver solicitud de amistad' });
  } finally {
    connection?.release();
  }
};

const deleteFriendship = async (req, res) => {
  const userId = req.user.user_id;
  const friendshipId = parsePositiveId(req.params.friendship_id);
  req.actions_data = {};

  if (!friendshipId) {
    return res.status(400).json({ error: 'El ID de la amistad no es válido' });
  }

  try {
    const [result] = await db.query(
      'DELETE FROM Friendship WHERE id = ? AND (user1 = ? OR user2 = ?)',
      [friendshipId, userId, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Amistad no encontrada' });
    }

    req.actions_data['friend-delete'] = {
      entity: 'Friendship',
      record_id: friendshipId,
      action: 'delete'
    };
    return res.status(200).json({ message: 'Amistad eliminada' });
  } catch (error) {
    console.error('Error al eliminar amistad:', error);
    return res.status(500).json({ error: 'Error al eliminar amistad' });
  }
};

module.exports = {
  getFriendshipRequests,
  getFriends,
  sendFriendRequest,
  acceptFriendRequest: resolveFriendRequest('ACCEPTED'),
  rejectFriendRequest: resolveFriendRequest('REJECTED'),
  cancelFriendRequest: resolveFriendRequest('CANCELLED'),
  deleteFriendship
};

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { getDb } = require('./mongodb');
const { getActiveSanction, toSuspensionResponse } = require('../utils/sanctions');

let io;

const getIo = () => io;

const initSocket = (server, allowedOrigins = []) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.replace(/^Bearer\s+/i, '').trim()
        : authHeader;

      if (!token) {
        return next(new Error('Token no proporcionado'));
      }

      const secret = process.env.SECRET;
      const decoded = jwt.verify(token, secret);
      if (!Number.isSafeInteger(decoded.user_id) || decoded.user_id <= 0) {
        return next(new Error('Token inválido o expirado'));
      }
      const [rows] = await db.query('SELECT id, role_id FROM User WHERE id = ? AND eliminated = 0', [decoded.user_id]);

      if (rows.length === 0) {
        return next(new Error('Usuario no encontrado'));
      }

      const sanction = await getActiveSanction(db, rows[0].id);
      if (sanction) {
        const error = new Error('ACCOUNT_SUSPENDED');
        error.data = {
          code: 'ACCOUNT_SUSPENDED',
          suspension: toSuspensionResponse(sanction)
        };
        return next(error);
      }

      socket.user = {
        user_id: rows[0].id,
        role_id: rows[0].role_id,
        sessionToken: token
      };
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return next(new Error('Token inválido o expirado'));
      }
      console.error('Error validando sesión de socket:', error);
      next(new Error('No se pudo validar la sesión'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.user_id}`);

    const ensureNotSuspended = async () => {
      try {
        const sanction = await getActiveSanction(db, socket.user.user_id);
        if (!sanction) return true;
        socket.emit('account:suspended', toSuspensionResponse(sanction));
      } catch (error) {
        console.error('Error verificando sanción de socket:', error);
      }
      socket.disconnect(true);
      return false;
    };

    socket.on('chat:join', async ({ friendship_id }) => {
      if (!(await ensureNotSuspended())) return;
      const friendshipId = Number(friendship_id);
      if (!Number.isSafeInteger(friendshipId) || friendshipId <= 0) {
        return socket.emit('chat:error', { message: 'El ID de la amistad no es válido' });
      }

      try {
        const [rows] = await db.query(
          'SELECT id FROM Friendship WHERE id = ? AND (user1 = ? OR user2 = ?)',
          [friendshipId, socket.user.user_id, socket.user.user_id]
        );

        if (rows.length === 0) {
          return socket.emit('chat:error', { message: 'No tienes acceso a ese chat' });
        }

        socket.join(`chat:${friendshipId}`);
        socket.emit('chat:joined', { friendship_id: friendshipId });
      } catch (error) {
        socket.emit('chat:error', { message: 'Error al unirse al chat' });
      }
    });

    socket.on('chat:send', async ({ friendship_id, text }) => {
      if (!(await ensureNotSuspended())) return;
      const friendshipId = Number(friendship_id);
      const cleanText = typeof text === 'string' ? text.replace(/[\u0000-\u001F\u007F]/g, '').trim() : '';

      if (!Number.isSafeInteger(friendshipId) || friendshipId <= 0 || !cleanText || cleanText.length > 4000) {
        return socket.emit('chat:error', { message: 'Datos de mensaje inválidos' });
      }

      try {
        const [rows] = await db.query(
          'SELECT id FROM Friendship WHERE id = ? AND (user1 = ? OR user2 = ?)',
          [friendshipId, socket.user.user_id, socket.user.user_id]
        );

        if (rows.length === 0) {
          return socket.emit('chat:error', { message: 'No tienes acceso a ese chat' });
        }

        const payload = {
          author_id: socket.user.user_id,
          text: cleanText,
          seen: false,
          friendship_id: friendshipId,
          created_at: new Date()
        };

        const result = await getDb().collection('Message').insertOne(payload);
        const message = {
          id: result.insertedId,
          ...payload
        };

        io.to(`chat:${friendshipId}`).emit('chat:message', message);
      } catch (error) {
        socket.emit('chat:error', { message: 'No se pudo enviar el mensaje' });
      }
    });

    socket.on('chat:read', async ({ friendship_id }) => {
      if (!(await ensureNotSuspended())) return;
      const friendshipId = Number(friendship_id);
      if (!Number.isSafeInteger(friendshipId) || friendshipId <= 0) {
        return socket.emit('chat:error', { message: 'El ID de la amistad no es válido' });
      }

      try {
        const [rows] = await db.query(
          'SELECT id FROM Friendship WHERE id = ? AND (user1 = ? OR user2 = ?)',
          [friendshipId, socket.user.user_id, socket.user.user_id]
        );

        if (rows.length === 0) {
          return socket.emit('chat:error', { message: 'No tienes acceso a ese chat' });
        }

        const result = await getDb().collection('Message').updateMany(
          { friendship_id: friendshipId, author_id: { $ne: socket.user.user_id }, seen: false },
          { $set: { seen: true } }
        );

        io.to(`chat:${friendshipId}`).emit('chat:read', {
          friendship_id: friendshipId,
          user_id: socket.user.user_id,
          updated_count: result.modifiedCount
        });
      } catch (error) {
        socket.emit('chat:error', { message: 'No se pudo marcar como leído' });
      }
    });
  });

  return io;
};

module.exports = { initSocket, getIo };

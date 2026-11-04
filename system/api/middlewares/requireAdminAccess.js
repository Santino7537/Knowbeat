const crypto = require('node:crypto');
const db = require('../config/db');
const { ADMINISTRATOR_ROLE } = require('../constants');

const requireAdminAccess = async (req, res, next) => {
  const rawToken = req.get('X-Admin-Authorization');
  if (!rawToken || !/^[a-f0-9]{64}$/i.test(rawToken)) {
    return res.status(401).json({ message: 'La autorización administrativa falta o venció.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const [sessions] = await db.query(
      `SELECT UNIX_TIMESTAMP(s.expires_at) * 1000 AS expires_at_ms
       FROM AdminAccessSession s
       JOIN User u ON u.id = s.user_id
       JOIN Role r ON r.id = u.role_id
       WHERE s.token_hash = ?
         AND s.user_id = ?
         AND s.expires_at > CURRENT_TIMESTAMP
         AND u.eliminated = 0
         AND r.role = ?
       LIMIT 1`,
      [tokenHash, req.user.user_id, ADMINISTRATOR_ROLE]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ message: 'La autorización administrativa falta o venció.' });
    }

    req.adminAccessSession = { expiresAt: Number(sessions[0].expires_at_ms) };
    return next();
  } catch (error) {
    console.error('Error verificando autorización administrativa:', error);
    return res.status(500).json({ message: 'No se pudo verificar el acceso administrativo.' });
  }
};

module.exports = requireAdminAccess;

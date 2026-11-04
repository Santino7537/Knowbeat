const jwt = require('jsonwebtoken');
const db = require('../config/db');

const SECRET = process.env.SECRET;

// Middleware para verificar token y cargar usuario en req.user
const checkToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  try {
    const decoded = jwt.verify(token, SECRET);
    if (!Number.isSafeInteger(decoded.user_id) || decoded.user_id <= 0) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    const [users] = await db.query(
      `SELECT u.id, u.role_id, u.eliminated, r.role
       FROM User u
       JOIN Role r ON r.id = u.role_id
       WHERE u.id = ?
       LIMIT 1`,
      [decoded.user_id]
    );
    const user = users[0];
    if (!user || user.eliminated) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    req.user = {
      sessionToken: token,
      role_id: user.role_id,
      role: user.role,
      user_id: user.id
    };

    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    console.error('Error al validar el token:', error);
    return res.status(500).json({ message: 'No se pudo validar la sesión.' });
  }
};

module.exports = checkToken;
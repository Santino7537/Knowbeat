const jwt = require('jsonwebtoken');
const db = require('../config/db');

const SECRET = process.env.SECRET;

// Middleware para verificar token y cargar usuario en req.user
const CheckToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    jwt.verify(token, SECRET, async (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token inválido o expirado' });

        // Buscar usuario por primary key
        let [user] = await db.query('SELECT id, role_id FROM user WHERE id = ?', [decoded.user_id]);
        if (user.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        user = user[0];

        // Guardar info del usuario en req.user
        req.user = {
            sessionToken: token,
            role_id: user.role_id,
            user_id: user.id
        };

        next();
    });
};

module.exports = CheckToken;
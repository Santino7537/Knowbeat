const db = require('../config/db');

const isAdmin = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id']; // para testing
        // Recibe el ID del usuario en el header 'x-user-id' (puede ser un token en una implementación real)

        // IMPORTANTE: Esto se tiene que cambiar despues por la autenticación real, donde se extrae el ID del usuario del token JWT o de la sesión

        if (!userId) {
            return res.status(400).json({ error: 'Falta x-user-id en headers' });
        }

        const [rows] = await db.query(
            'SELECT role_id FROM User WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // 2 = admin
        if (rows[0].role_id !== 2) {
            return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
        }

        next();
    } catch (err) {
        console.error('Error en isAdmin middleware', err);
        return res.status(500).json({ error: 'Error interno al verificar rol' });
    }
};

module.exports = isAdmin;
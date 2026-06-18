const { ROLES_PERMISSIONS, ADMINISTRATOR_ROLE } = require('../constants');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.SECRET;

const deleteUser = async (req, res) => {
    const userId = req.params.id;
  
    req.actions_data = {};
    if (req.body.password) req.body.password = "[REDACTED]";

    let [userPayload] = await db.query(
        'SELECT * FROM User WHERE id = ?',
        [userId]
    );

    if (userPayload.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
    }

    // Guardar dvh viejo y actualizar dvh
    userPayload = userPayload[0];
    const oldDvh = userPayload.dvh;
    userPayload.eliminated = 1;
    delete userPayload.dvh;
    const newDvh = ComputeDVHFromObject(userPayload);
    userPayload.dvh = newDvh;

    req.actions_data["user-delete-user"] = {
        entity: "User",
        record_id: userId,
        action: "update",
        old_dvh: oldDvh,
        new_dvh: newDvh
    };

    try {
        const [result] = await db.query(
            'UPDATE User SET eliminated = ?, dvh = ? WHERE id = ?;',
            [1, newDvh, userId]
        );
      
        if (result.affectedRows === 0) { return res.status(404).json({ error: 'Usuario no encontrado' }); }

        res.json({ message: 'Usuario eliminado exitosamente' });
    } 
    
    catch (error) { res.status(500).json({ error: 'Error al eliminar usuario' }); }
};
  
const changeRole = async (req, res) => {
    const { rol } = req.body;
    const userId = req.params.id;

    req.actions_data = {};
    if (req.body.password) req.body.password = "[REDACTED]";

    try {

        // validar rol permitido
        if (!Number.isInteger(rol) || !(0 < rol && rol <= Object.keys(ROLES_PERMISSIONS).length)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        let [userPayload] = await db.query(
            'SELECT * FROM User WHERE id = ?',
            [userId]
        );

        // validar usuario existente
        if (userPayload.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        userPayload = userPayload[0];

        // impedir modificar admins
        if (
            userPayload.role_id ===
            Object.keys(ROLES_PERMISSIONS).indexOf(ADMINISTRATOR_ROLE) + 1
        ) {
            return res.status(403).json({
                error: 'No se le puede cambiar el rol a un administrador'
            });
        }

        const oldDvh = userPayload.dvh;

        // Modificar payload como quedará en BD
        userPayload.role_id = rol;

        // Recalcular DVH
        delete userPayload.dvh;

        const newDvh = ComputeDVHFromObject(userPayload);

        userPayload.dvh = newDvh;

        req.actions_data["user-update-role"] = {
            entity: "User",
            record_id: userId,
            action: "update",
            old_dvh: oldDvh,
            new_dvh: newDvh
        };

        await db.query(
            'UPDATE User SET role_id = ?, dvh = ? WHERE id = ?',
            [rol, newDvh, userId]
        );

        return res.json({
            message: 'Se cambió el rol del usuario correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Error al cambiar el rol al usuario'
        });
    }
};

module.exports = {
    deleteUser,
    changeRole
};
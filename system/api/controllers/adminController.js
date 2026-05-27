const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.SECRET;

const deleteUser = async (req, res) => {
    const userId = req.params.id;
  
    try {
      const [result] = await db.query('UPDATE user SET `eliminated` = 1 WHERE (`id` = ?);', [userId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json({ message: 'Usuario eliminado exitosamente' });
    } 
    
    catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};
  
const changeRole = async (req, res) => {

    const { rol } = req.body;
    const userId = req.params.id;

    try {

        // validar rol permitido
        if (![1, 2, 3].includes(rol)) {
        return res.status(400).json({
            error: 'Rol inválido'
        });
        }

        const [result] = await db.query(
        'SELECT role_id FROM user WHERE id = ?',
        [userId]
        );

        // validar usuario existente
        if (result.length === 0) {
        return res.status(404).json({
            error: 'Usuario no encontrado'
        });
        }

        // impedir modificar admins
        if (result[0].role_id === 2) {
        return res.status(403).json({
            error: 'No se le puede cambiar el rol a un administrador'
        });
        }

        await db.query(
        'UPDATE user SET role_id = ? WHERE id = ?',
        [rol, userId]
        );

        return res.json({
        message: 'Se cambió el rol del usuario correctamente'
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
        error: 'Error al cambiar el rol al usuario'
        });
    }
};

module.exports = {deleteUser, changeRole};
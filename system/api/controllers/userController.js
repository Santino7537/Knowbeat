const db = require('../config/db');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
  const { username, password } = req.body;

  // if (password) req.body.password = "[REDACTED]"; esto es si se guarda el body

  if (!username || !password) {
    return res.status(400).json({ message: 'Nombre de usuario o contraseña faltante' });
  }

  let user;

  try {
    [user] = await db.query('SELECT * FROM user WHERE username = ?;', [username]);
    if (user.length === 0) return res.status(400).json({ message: 'Usuario no encontrado' });
    user = user[0];
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }

  const compare = await bcrypt.compare(password, user.password);
  if (!compare) return res.status(400).json({ message: 'Usuario o contraseña incorrecta' });

  res.json({ message: 'Login exitoso', user });
};

const getUsers = async (req, res) => {

  try {
    const [rows] = await db.query('SELECT * FROM user');
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }

};

const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const [result] = await db.query('DELETE FROM User WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

module.exports = {
  login,
  getUsers,
  deleteUser
};
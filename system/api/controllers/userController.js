const db = require('../config/db');

const getUsers = async (req, res) => {

  try {
    const [rows] = await db.query('SELECT * FROM user');
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }

};

module.exports = {
  getUsers
};
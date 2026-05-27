const db = require('../config/db');

const getCourses = async (req, res) => {

  try {
    const [rows] = await db.query('SELECT * FROM course');
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener cursos' });
  }

};

const getUserProgress = async (req, res) => {

    const userId = req.params.id;

    try {
        const [rows] = await db.query(`SELECT
        p.user_id,
        p.course_id,
        p.current_lesson,
        c.name,
        c.total_lessons
      FROM progress p
      JOIN course c
        ON p.course_id = c.id
      WHERE p.user_id = ?`, [userId]);
        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los cursos a los que el usuario está anotado' });
    }

};

module.exports = {
    getCourses,
    getUserProgress,

};
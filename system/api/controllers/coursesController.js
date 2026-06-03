const db = require('../config/db');

const getCourses = async (req, res) => {

  const userId = req.user.user_id;

  try {

    // Devuelve los datos de los cursos + un valor true/false, indica si el usuario está inscripto al curso
    const [rows] = await db.query(`
      SELECT 
        c.*,
        CASE 
          WHEN p.user_id IS NOT NULL THEN 1
          ELSE 0
        END AS isEnrolled
        FROM Course c
        LEFT JOIN Progress p
        ON c.id = p.course_id
        AND p.user_id = ?
    `, [userId]);

    res.json(rows);

      /* Devuelve algo como esto:
      [
        {
          "id": 1,
          "name": "React",
          "isEnrolled": 1
        },
        {
          "id": 2,
          "name": "Python",
          "isEnrolled": 0
        }
      ]
      */

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener cursos' });
  }

};

const getUserProgress = async (req, res) => {

    const userId = req.user.user_id;

    try {
        const [rows] = await db.query(`SELECT
        p.user_id,
        p.course_id,
        p.current_lesson,
        c.name,
        c.total_lessons
        FROM Progress p
        JOIN Course c
        ON p.course_id = c.id
        WHERE p.user_id = ?`, 
        [userId]);
        
        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los cursos a los que el usuario está anotado' });
    }

};

const registerCourse = async(req,res) => {

  const userId = req.user.user_id;

  // Por params (campo id) se recibe la id del curso, no del usuario (anteriormente se mandaba por params:id la id del user)
  const courseId = req.params.id;
  
  try {
        const [rows] = await db.query(`
          INSERT INTO Progress (user_id, course_id, current_lesson) 
          VALUES (?,?,?)
          `, 
        [userId, courseId, 0]);
        
        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al anotarse a un curso' });
    }

}

module.exports = {
    getCourses,
    getUserProgress,
    registerCourse
};

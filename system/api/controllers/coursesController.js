const db = require('../config/db');

const getCourses = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const [rows] = await db.query(`
      SELECT
        c.id AS course_id,
        c.name,
        c.total_lessons,
        EXISTS (
          SELECT 1
          FROM Progress p
          WHERE p.course_id = c.id AND p.user_id = ?
        ) AS is_enrolled
      FROM Course c
      ORDER BY c.name ASC
    `, [userId]);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el catálogo de cursos' });
  }
};

const getCoursesRegistered = async (req, res) => {

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
  const courseId = Number(req.params.id);

  if (!Number.isSafeInteger(courseId) || courseId <= 0) {
    return res.status(400).json({ error: 'El ID del curso no es válido' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [courses] = await connection.query(
      'SELECT id FROM Course WHERE id = ? FOR UPDATE',
      [courseId]
    );

    if (courses.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'El curso no existe' });
    }

    const [enrollments] = await connection.query(
      'SELECT user_id FROM Progress WHERE user_id = ? AND course_id = ? LIMIT 1',
      [userId, courseId]
    );

    if (enrollments.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Ya estás anotado a este curso' });
    }

    const [result] = await connection.query(
      'INSERT INTO Progress (user_id, course_id, current_lesson) VALUES (?, ?, 1)',
      [userId, courseId]
    );

    await connection.commit();
    req.actions_data = {
      'user-register-course': {
        entity: 'Progress',
        record_id: result.insertId,
        action: 'insert'
      }
    };

    return res.status(201).json({ message: 'Te anotaste al curso correctamente' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(error);
    return res.status(500).json({ error: 'Error al anotarse a un curso' });
  } finally {
    connection?.release();
  }
}

const updateUserProgress = async (req, res) => {
  const userId = req.user.user_id;
  const courseId = Number(req.params.id);
  const expectedLesson = Number(req.body?.current_lesson);

  if (!Number.isSafeInteger(courseId) || courseId <= 0) {
    return res.status(400).json({ error: 'El ID del curso no es válido' });
  }

  if (!Number.isSafeInteger(expectedLesson) || expectedLesson <= 0) {
    return res.status(400).json({ error: 'La lección actual no es válida' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [progressRows] = await connection.query(`
      SELECT p.current_lesson, c.total_lessons
      FROM Progress p
      JOIN Course c ON c.id = p.course_id
      WHERE p.user_id = ? AND p.course_id = ?
      FOR UPDATE
    `, [userId, courseId]);

    if (progressRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'No estás anotado a este curso' });
    }

    const storedLesson = Number(progressRows[0].current_lesson);
    const currentLesson = Math.max(1, storedLesson);
    const totalLessons = Number(progressRows[0].total_lessons);

    if (currentLesson !== expectedLesson) {
      await connection.rollback();
      return res.status(409).json({
        error: 'El progreso del curso cambió. Actualizá la página e intentá nuevamente.',
        current_lesson: currentLesson
      });
    }

    if (currentLesson > totalLessons) {
      await connection.rollback();
      return res.status(409).json({
        error: 'Ya completaste todas las lecciones de este curso.',
        current_lesson: currentLesson
      });
    }

    const nextLesson = currentLesson + 1;
    await connection.query(
      'UPDATE Progress SET current_lesson = ? WHERE user_id = ? AND course_id = ?',
      [nextLesson, userId, courseId]
    );

    await connection.commit();
    req.actions_data = {
      'user-update-progress': {
        entity: 'Progress',
        record_id: `${userId}:${courseId}`,
        action: 'update'
      }
    };

    return res.status(200).json({ current_lesson: nextLesson });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(error);
    return res.status(500).json({ error: 'Error al actualizar el progreso del curso' });
  } finally {
    connection?.release();
  }
};

module.exports = {
    getCourses,
    getCoursesRegistered,
    getUserProgress,
    registerCourse,
    updateUserProgress,
};

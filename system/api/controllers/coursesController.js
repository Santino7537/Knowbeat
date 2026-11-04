const db = require('../config/db');
const { computeDVHFromObject } = require('../utils/dvhHelpers');
const getLessonScore = require('../utils/lessonScore');

// No hay una zona horaria por usuario configurada; el historial diario usa el calendario local del servidor.
const getLocalIsoDate = (date = new Date()) => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
      SELECT p.current_lesson, c.total_lessons, c.name AS course_name
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
    const dailyPoints = await getLessonScore(progressRows[0].course_name, currentLesson);
    const activityDate = getLocalIsoDate();
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = getLocalIsoDate(yesterday);

    const [userRows] = await connection.query(
      'SELECT * FROM User WHERE id = ? FOR UPDATE',
      [userId]
    );
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userPayload = userRows[0];
    const currentScore = Number(userPayload.score);
    const currentStreak = Number(userPayload.streak);
    if (!Number.isSafeInteger(currentScore) || currentScore < 0
      || !Number.isSafeInteger(currentStreak) || currentStreak < 0) {
      throw new Error('El score o la racha del usuario no tienen un valor válido.');
    }

    const [activityRows] = await connection.query(
      `SELECT activity_date
       FROM UserDailyScore
       WHERE user_id = ?
       ORDER BY activity_date DESC
       LIMIT 1`,
      [userId]
    );
    const lastActivityDate = activityRows.length === 0
      ? null
      : typeof activityRows[0].activity_date === 'string'
        ? activityRows[0].activity_date.slice(0, 10)
        : new Date(activityRows[0].activity_date).toISOString().slice(0, 10);
    const nextStreak = lastActivityDate === activityDate
      ? Math.max(currentStreak, 1)
      : lastActivityDate === yesterdayDate
        ? Math.max(currentStreak, 1) + 1
        : 1;
    const nextScore = currentScore + dailyPoints;
    if (!Number.isSafeInteger(nextScore)) {
      throw new Error('El score total del usuario excede el valor permitido.');
    }

    userPayload.score = nextScore;
    userPayload.streak = nextStreak;
    const oldDvh = userPayload.dvh;
    delete userPayload.dvh;
    const newDvh = computeDVHFromObject(userPayload);

    await connection.query(
      'UPDATE Progress SET current_lesson = ? WHERE user_id = ? AND course_id = ?',
      [nextLesson, userId, courseId]
    );

    await connection.query(
      `INSERT INTO UserDailyScore (user_id, activity_date, score_earned)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE score_earned = score_earned + VALUES(score_earned)`,
      [userId, activityDate, dailyPoints]
    );

    await connection.query(
      'UPDATE User SET score = ?, streak = ?, dvh = ? WHERE id = ?',
      [nextScore, nextStreak, newDvh, userId]
    );

    await connection.commit();
    req.actions_data = {
      'user-update-progress': {
        entity: 'Progress',
        record_id: `${userId}:${courseId}`,
        action: 'update'
      },
      'user-update-score-streak': {
        entity: 'User',
        record_id: userId,
        action: 'update',
        old_dvh: oldDvh,
        new_dvh: newDvh
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

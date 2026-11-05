const db = require('../config/db');
const { MAX_DAILY_GOAL } = require('../constants');
const { computeDVHFromObject } = require('../utils/dvhHelpers');

// No hay una zona horaria por usuario configurada; para mantener la consistencia entre
// la fecha de actividad y la consulta del historial, usamos el calendario local del servidor.
const getLocalIsoDate = (date = new Date()) => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Este endpoint devuelve los 3 campos de racha y puntaje
const getUserStats = async (req, res) => {

    const userId = req.user.user_id;
  
    try {
  
      const [rows] = await db.query(
        `SELECT streak, score, score_goal
         FROM User
         WHERE id = ?`,
        [userId]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }
  
      res.json(rows[0]);
  
    } catch (error) {
  
      console.error(error);
  
      res.status(500).json({
        error: 'Error al obtener las estadísticas del usuario'
      });
  
    }
};

const getUserScoreHistory = async (req, res) => {
    const userId = req.user.user_id;
    const daysParam = Number(req.query.days ?? 7);

    if (!Number.isInteger(daysParam) || daysParam <= 0 || daysParam > 365) {
      return res.status(400).json({ error: 'La cantidad de días debe ser un entero entre 1 y 365' });
    }

    try {
      const today = new Date();
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);

      const rows = await db.query(
        `SELECT activity_date, score_earned
         FROM UserDailyScore
         WHERE user_id = ?
           AND activity_date BETWEEN DATE_SUB(?, INTERVAL ? DAY) AND ?
         ORDER BY activity_date ASC`,
        [userId, getLocalIsoDate(start), daysParam - 1, getLocalIsoDate(start)]
      );

      const scoreMap = new Map();
      for (const row of rows[0] || []) {
        const dateKey = typeof row.activity_date === 'string'
          ? row.activity_date.slice(0, 10)
          : new Date(row.activity_date).toISOString().slice(0, 10);
        scoreMap.set(dateKey, Number(row.score_earned || 0));
      }

      const history = [];
      for (let offset = daysParam - 1; offset >= 0; offset -= 1) {
        const date = new Date(today);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - offset);

        const dateKey = getLocalIsoDate(date);
        history.push({
          date: dateKey,
          score_earned: scoreMap.get(dateKey) ?? 0
        });
      }

      res.json(history);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el historial de score diario' });
    }
};

const changeGoal = async (req, res) => {

    const userId = req.user.user_id;
    const { score_goal } = req.body;
    const hasGoal = score_goal !== undefined && score_goal !== null;

    req.actions_data = {};
    if (req.body.password) req.body.password = "[REDACTED]";
  
    try {
      if (!hasGoal) {
        return res.status(400).json({ error: 'Falta el valor de score_goal' });
      }

      if (
        score_goal !== null && (
          !Number.isInteger(score_goal) ||
          score_goal <= 0 ||
          score_goal > MAX_DAILY_GOAL
        )
      ) {
        return res.status(400).json({
          error: `La meta diaria debe ser un número entero positivo entre 1 y ${MAX_DAILY_GOAL}`
        });
      }
  
      let [userPayload] = await db.query(
        'SELECT * FROM User WHERE id = ?',
        [userId]
      );
  
      if (userPayload.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }
  
      userPayload = userPayload[0];
  
      if (userPayload.score_goal === score_goal) {
        return res.status(400).json({
          error: 'La meta diaria ya tiene ese valor'
        });
      }
  
      const oldDvh = userPayload.dvh;
      userPayload.score_goal = score_goal;

      delete userPayload.dvh;
      const newDvh = computeDVHFromObject(userPayload);
      userPayload.dvh = newDvh;
  
      req.actions_data["change-score-goal"] = {
        entity: "User",
        record_id: userId,
        action: "update",
        old_dvh: oldDvh,
        new_dvh: newDvh
      };
  
      await db.query(
        'UPDATE User SET score_goal = ?, dvh = ? WHERE id = ?',
        [score_goal, newDvh, userId]
      );
  
      res.status(200).json({
        message: 'Meta diaria actualizada correctamente',
        score_goal
      });
  
    } catch (error) {
  
      console.error(error);
  
      res.status(500).json({
        error: 'Error al actualizar la meta diaria'
      });
  
    }
};

module.exports = {
    getUserStats,
    getUserScoreHistory,
    changeGoal,
}


const db = require('../config/db');

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

const changeGoal = async (req, res) => {

    const userId = req.user.user_id;
    const { score_goal } = req.body;
  
    req.actions_data = {};
    if (password) req.body.password = "[REDACTED]";

  
    try {
  
      if (
        !Number.isInteger(score_goal) ||
        score_goal < 0 ||
        score_goal > 5000
      ) {
        return res.status(400).json({
          error: 'La meta diaria debe ser un número entero entre 0 y 5000'
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
  
      // Evitar actualizar si no hubo cambios
      if (userPayload.score_goal === score_goal) {
        return res.status(400).json({
          error: 'La meta diaria ya tiene ese valor'
        });
      }
  
      const oldDvh = userPayload.dvh;
  
      // Actualizar payload
      userPayload.score_goal = score_goal;
  
      // Recalcular DVH
      delete userPayload.dvh;
  
      const newDvh = ComputeDVHFromObject(userPayload);
  
      userPayload.dvh = newDvh;
  
      // Bitácora
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
    getUserStats, changeGoal,
}


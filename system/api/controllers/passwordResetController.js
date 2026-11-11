const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { computeDVHFromObject } = require('../utils/dvhHelpers');
const { sendPasswordResetEmail } = require('../utils/email');

const TOKEN_TTL_MINUTES = 30;
const requestPasswordReset = async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  if (!username || username.length > 50) {
    return res.status(400).json({ message: 'Ingresá un nombre de usuario válido.' });
  }

  try {
    const [users] = await db.query(
      'SELECT id, username, email FROM User WHERE username = ? AND eliminated = 0;',
      [username]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'No existe una cuenta con ese nombre de usuario.' });
    }

    const user = users[0];
    const [recentRequests] = await db.query(
      'SELECT id FROM PasswordResetToken WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND) LIMIT 1;',
      [user.id]
    );
    if (recentRequests.length) {
      return res.status(429).json({ message: 'Esperá un minuto antes de solicitar otro correo.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await db.query('DELETE FROM PasswordResetToken WHERE user_id = ?;', [user.id]);
    const [insertResult] = await db.query(
      'INSERT INTO PasswordResetToken (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE));',
      [user.id, tokenHash, TOKEN_TTL_MINUTES]
    );

    try {
      await sendPasswordResetEmail(user.email, user.username, token);
    } catch (error) {
      await db.query('DELETE FROM PasswordResetToken WHERE id = ?;', [insertResult.insertId]);
      console.error('No se pudo enviar el correo de recuperación:', error);
      return res.status(503).json({ message: 'No se pudo enviar el correo. Revisá la configuración del servicio e intentá de nuevo.' });
    }

    return res.status(200).json({ message: 'Te enviamos un enlace para cambiar la contraseña.' });
  } catch (error) {
    console.error('Error al solicitar el restablecimiento de contraseña:', error);
    return res.status(500).json({ message: 'No se pudo procesar la solicitud de recuperación.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body ?? {};
  if (typeof token !== 'string' || !/^[a-f\d]{64}$/i.test(token)) {
    return res.status(400).json({ message: 'El enlace de recuperación no es válido o venció.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: 'La contraseña debe tener entre 8 y 128 caracteres.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  let connection;
  let transactionStarted = false;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [tokens] = await connection.query(
      'SELECT id, user_id FROM PasswordResetToken WHERE token_hash = ? AND expires_at > NOW() FOR UPDATE;',
      [tokenHash]
    );
    if (tokens.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(400).json({ message: 'El enlace de recuperación no es válido o venció.' });
    }

    const [users] = await connection.query(
      'SELECT * FROM User WHERE id = ? AND eliminated = 0 FOR UPDATE;',
      [tokens[0].user_id]
    );
    if (users.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(400).json({ message: 'El enlace de recuperación no es válido o venció.' });
    }

    const user = users[0];
    user.password = await bcrypt.hash(password, 10);
    delete user.dvh;
    const newDvh = computeDVHFromObject(user);

    await connection.query(
      'UPDATE User SET password = ?, dvh = ? WHERE id = ?;',
      [user.password, newDvh, user.id]
    );
    await connection.query('DELETE FROM PasswordResetToken WHERE user_id = ?;', [user.id]);
    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({ message: 'Tu contraseña se cambió correctamente. Ya podés iniciar sesión.' });
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error al revertir el cambio de contraseña:', rollbackError);
      }
    }
    console.error('Error al restablecer la contraseña:', error);
    return res.status(500).json({ message: 'No se pudo cambiar la contraseña. Probá de nuevo.' });
  } finally {
    connection?.release();
  }
};

module.exports = { requestPasswordReset, resetPassword };

const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { ADMINISTRATOR_ROLE } = require('../constants');

const ADMIN_ACCESS_TTL_MINUTES = 10;
const MAX_FAILED_ATTEMPTS = 5;
const GENERIC_FAILURE_MESSAGE = 'No se pudo verificar el acceso administrativo.';

const isRateLimited = async (userId) => {
  const [rows] = await db.query(
    `SELECT locked_until IS NOT NULL AND locked_until > CURRENT_TIMESTAMP AS is_locked
     FROM AdminPasswordAttempt
     WHERE user_id = ?`,
    [userId]
  );
  return Boolean(rows[0]?.is_locked);
};

const recordFailedAttempt = async (userId) => {
  await db.query(
    `INSERT INTO AdminPasswordAttempt
       (user_id, failed_attempts, window_started_at, locked_until)
     VALUES (?, 1, CURRENT_TIMESTAMP, NULL)
     ON DUPLICATE KEY UPDATE
       locked_until = CASE
         WHEN window_started_at <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE) THEN NULL
         WHEN failed_attempts >= ? THEN DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE)
         ELSE locked_until
       END,
       failed_attempts = CASE
         WHEN window_started_at <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE) THEN 1
         ELSE failed_attempts + 1
       END,
       window_started_at = CASE
         WHEN window_started_at <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE) THEN CURRENT_TIMESTAMP
         ELSE window_started_at
       END`,
    [userId, MAX_FAILED_ATTEMPTS - 1]
  );
};

const verifyAdminPassword = async (req, res) => {
  const password = req.body?.password;
  if (req.body && Object.hasOwn(req.body, 'password')) req.body.password = '[REDACTED]';

  if (typeof password !== 'string' || password.length === 0 || password.length > 128) {
    return res.status(400).json({ message: 'Ingresá tu contraseña para continuar.' });
  }

  const userId = req.user.user_id;
  if (req.user.role !== ADMINISTRATOR_ROLE) {
    return res.status(403).json({ message: GENERIC_FAILURE_MESSAGE });
  }

  try {
    if (await isRateLimited(userId)) {
      return res.status(429).json({ message: 'Demasiados intentos. Esperá 15 minutos.' });
    }

    const [users] = await db.query(
      `SELECT u.password, r.role
       FROM User u
       JOIN Role r ON r.id = u.role_id
       WHERE u.id = ? AND u.eliminated = 0
       LIMIT 1`,
      [userId]
    );

    const user = users[0];
    if (!user || user.role !== ADMINISTRATOR_ROLE) {
      return res.status(403).json({ message: GENERIC_FAILURE_MESSAGE });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      await recordFailedAttempt(userId);
      if (await isRateLimited(userId)) {
        return res.status(429).json({ message: 'Demasiados intentos. Esperá 15 minutos.' });
      }
      return res.status(403).json({ message: GENERIC_FAILURE_MESSAGE });
    }

    await db.query('DELETE FROM AdminPasswordAttempt WHERE user_id = ?', [userId]);

    const authorization = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(authorization).digest('hex');

    await db.query(
      'DELETE FROM AdminAccessSession WHERE expires_at <= CURRENT_TIMESTAMP'
    );
    await db.query(
      `INSERT INTO AdminAccessSession (token_hash, user_id, expires_at)
       VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${ADMIN_ACCESS_TTL_MINUTES} MINUTE))`,
      [tokenHash, userId]
    );
    const [[session]] = await db.query(
      'SELECT UNIX_TIMESTAMP(expires_at) * 1000 AS expires_at_ms FROM AdminAccessSession WHERE token_hash = ?',
      [tokenHash]
    );
    const expiresAt = new Date(Number(session?.expires_at_ms));
    if (!Number.isFinite(expiresAt.getTime())) {
      throw new Error('No se pudo determinar la expiración de la sesión administrativa.');
    }

    req.actions_data = {
      'admin-password-verified': {
        entity: 'AdminAccessSession',
        record_id: userId,
        action: 'insert'
      }
    };
    return res.status(200).json({
      authorization,
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error al verificar acceso administrativo:', error);
    return res.status(500).json({ message: 'No se pudo verificar el acceso administrativo.' });
  }
};

const getAdminSession = (req, res) =>
  res.json({ expires_at: new Date(req.adminAccessSession.expiresAt).toISOString() });

const revokeAdminSession = async (req, res) => {
  const rawToken = req.get('X-Admin-Authorization');
  if (rawToken && /^[a-f0-9]{64}$/i.test(rawToken)) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    try {
      await db.query(
        'DELETE FROM AdminAccessSession WHERE token_hash = ? AND user_id = ?',
        [tokenHash, req.user.user_id]
      );
    } catch (error) {
      console.error('Error al revocar autorización administrativa:', error);
      return res.status(500).json({ message: 'No se pudo cerrar el acceso administrativo.' });
    }
  }

  return res.status(204).end();
};

const logout = async (req, res) => {
  try {
    await db.query('DELETE FROM AdminAccessSession WHERE user_id = ?', [req.user.user_id]);
    return res.status(204).end();
  } catch (error) {
    console.error('Error al invalidar sesiones administrativas:', error);
    return res.status(500).json({ message: 'No se pudo cerrar la sesión.' });
  }
};

module.exports = {
  verifyAdminPassword,
  getAdminSession,
  revokeAdminSession,
  logout
};

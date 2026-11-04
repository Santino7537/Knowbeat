const db = require('./db');

const initAdminAccess = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS AdminAccessSession (
      token_hash CHAR(64) NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (token_hash),
      KEY idx_admin_access_user_expiry (user_id, expires_at),
      CONSTRAINT fk_admin_access_user
        FOREIGN KEY (user_id) REFERENCES User(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS AdminPasswordAttempt (
      user_id INT UNSIGNED NOT NULL,
      failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
      window_started_at DATETIME NOT NULL,
      locked_until DATETIME NULL,
      PRIMARY KEY (user_id),
      CONSTRAINT fk_admin_password_attempt_user
        FOREIGN KEY (user_id) REFERENCES User(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

module.exports = initAdminAccess;

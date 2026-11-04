const db = require('./db');

const ensureUserDailyScoreTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS UserDailyScore (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      activity_date DATE NOT NULL,
      score_earned INT UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_daily_score_user_date (user_id, activity_date),
      KEY idx_user_daily_score_user_date (user_id, activity_date),
      CONSTRAINT fk_user_daily_score_user
        FOREIGN KEY (user_id) REFERENCES User(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

module.exports = ensureUserDailyScoreTable;

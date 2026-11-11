-- -----------------------------------------------------
-- Table Binnacle
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Binnacle` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actions` JSON NOT NULL,
  `endpoint_route` VARCHAR(200) NOT NULL,
  `ip_source` VARCHAR(50) NULL DEFAULT NULL,
  `user_id` INT UNSIGNED NULL DEFAULT NULL,
  `session_token` VARCHAR(300) NULL,
  `request_data` JSON NOT NULL,
  `response_data` JSON NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `dvh` CHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `user_id` (`user_id` ASC),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table Course
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Course` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `total_lessons` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table DVV
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `DVV` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `table_name` VARCHAR(50) NOT NULL,
  `dvv_value` INT UNSIGNED NOT NULL,
  `snapshot_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC),
  UNIQUE INDEX `uq_dvv_table_name` (`table_name` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table Role
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Role` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table User
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `User` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(200) NOT NULL,
  `picture` VARCHAR(300) NOT NULL,
  `streak` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_streak_date` DATE NULL,
  `score` INT UNSIGNED NOT NULL DEFAULT 0,
  `score_goal` INT UNSIGNED NULL,
  `configuration` JSON NOT NULL,
  `biography` TEXT NULL DEFAULT NULL,
  `penalty_date` DATE NOT NULL,
  `eliminated` TINYINT NOT NULL,
  `dvh` CHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username` (`username` ASC),
  UNIQUE INDEX `email` (`email` ASC),
  INDEX `role_id` (`role_id` ASC),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC),
  CONSTRAINT `user_ibfk_1`
    FOREIGN KEY (`role_id`)
    REFERENCES `knowbeat`.`Role` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table Friendship
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Friendship` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user1` INT UNSIGNED NOT NULL,
  `user2` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `friendship_users` (`user1`, `user2`),
  INDEX `user2` (`user2` ASC),
  CONSTRAINT `friendship_ibfk_1`
    FOREIGN KEY (`user1`)
    REFERENCES `knowbeat`.`User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `friendship_ibfk_2`
    FOREIGN KEY (`user2`)
    REFERENCES `knowbeat`.`User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table FriendshipRequest
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `FriendshipRequest` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sender_id` INT UNSIGNED NOT NULL,
  `receiver_id` INT UNSIGNED NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `friendship_request_sender_status` (`sender_id`, `status`),
  INDEX `friendship_request_receiver_status` (`receiver_id`, `status`),
  CONSTRAINT `friendship_request_ibfk_1`
    FOREIGN KEY (`sender_id`)
    REFERENCES `knowbeat`.`User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `friendship_request_ibfk_2`
    FOREIGN KEY (`receiver_id`)
    REFERENCES `knowbeat`.`User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table Permission
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Permission` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `permission` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table Progress
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Progress` (
  `user_id` INT UNSIGNED NOT NULL,
  `course_id` INT UNSIGNED NOT NULL,
  `current_lesson` INT NOT NULL,
  PRIMARY KEY (`user_id`, `course_id`),
  INDEX `course_id` (`course_id` ASC),
  CONSTRAINT `progress_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `knowbeat`.`User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `progress_ibfk_2`
    FOREIGN KEY (`course_id`)
    REFERENCES `knowbeat`.`Course` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


-- -----------------------------------------------------
-- Table RolePermission
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `RolePermission` (
  `role_id` INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  INDEX `permission_id` (`permission_id` ASC),
  CONSTRAINT `rolepermission_ibfk_1`
    FOREIGN KEY (`role_id`)
    REFERENCES `knowbeat`.`Role` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `rolepermission_ibfk_2`
    FOREIGN KEY (`permission_id`)
    REFERENCES `knowbeat`.`Permission` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


CREATE TABLE IF NOT EXISTS `Report` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reporter_id` INT UNSIGNED NOT NULL,
  `reported_id` INT UNSIGNED NOT NULL,
  `reviser_id` INT UNSIGNED NULL,
  `admin_comment` TEXT NULL,
  `status` VARCHAR(50) NOT NULL,
  `reason` VARCHAR(50) NOT NULL,
  `description` TEXT NOT NULL,
  `date` DATETIME NOT NULL,
  `review_date` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `fk_Report_User1_idx` (`reporter_id`),
  KEY `fk_Report_User2_idx` (`reported_id`),
  KEY `fk_Report_User3_idx` (`reviser_id`),
  KEY `idx_Report_status_date` (`status`, `date`),
  CONSTRAINT `fk_Report_User1`
    FOREIGN KEY (`reporter_id`) REFERENCES `User` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_Report_User2`
    FOREIGN KEY (`reported_id`) REFERENCES `User` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_Report_User3`
    FOREIGN KEY (`reviser_id`) REFERENCES `User` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `UserSanction` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `admin_id` INT UNSIGNED NOT NULL,
  `is_permanent` TINYINT(1) NOT NULL DEFAULT 0,
  `starts_at` DATETIME NOT NULL,
  `expires_at` DATETIME NULL,
  `admin_comment` VARCHAR(1000) NOT NULL,
  `revoked_at` DATETIME NULL,
  `revoked_by` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_UserSanction_report_id` (`report_id`),
  KEY `idx_UserSanction_user_active` (`user_id`, `revoked_at`, `expires_at`),
  CONSTRAINT `fk_UserSanction_Report`
    FOREIGN KEY (`report_id`) REFERENCES `Report` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_UserSanction_User`
    FOREIGN KEY (`user_id`) REFERENCES `User` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_UserSanction_Admin`
    FOREIGN KEY (`admin_id`) REFERENCES `User` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_UserSanction_Revoker`
    FOREIGN KEY (`revoked_by`) REFERENCES `User` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `chk_UserSanction_expiry`
    CHECK (
      (`is_permanent` = 1 AND `expires_at` IS NULL)
      OR (`is_permanent` = 0 AND `expires_at` IS NOT NULL)
    )
) ENGINE=InnoDB;


-- -----------------------------------------------------
-- Table UserDailyScore
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `UserDailyScore` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `activity_date` DATE NOT NULL,
  `score_earned` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_daily_score_user_date` (`user_id`, `activity_date`),
  KEY `idx_user_daily_score_user_date` (`user_id`, `activity_date`),
  CONSTRAINT `fk_user_daily_score_user`
    FOREIGN KEY (`user_id`) REFERENCES `knowbeat`.`User`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table AdminAccessSession
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AdminAccessSession` (
  `token_hash` CHAR(64) NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_hash`),
  KEY `idx_admin_access_user_expiry` (`user_id`, `expires_at`),
  CONSTRAINT `fk_admin_access_user`
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table AdminPasswordAttempt
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AdminPasswordAttempt` (
  `user_id` INT UNSIGNED NOT NULL,
  `failed_attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `window_started_at` DATETIME NOT NULL,
  `locked_until` DATETIME NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_admin_password_attempt_user`
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table PasswordResetToken
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `PasswordResetToken` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `password_reset_token_hash` (`token_hash`),
  INDEX `password_reset_user_created` (`user_id`, `created_at`),
  CONSTRAINT `password_reset_user_fk`
    FOREIGN KEY (`user_id`)
    REFERENCES `knowbeat`.`User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;

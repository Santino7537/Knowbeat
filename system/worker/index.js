const mysql = require('mysql2/promise');
const { createDVVAccumulator } = require('../api/utils/dvhHelpers');
const { nextScheduledRun, formatLocalDateTime } = require('./schedule');

const LOCK_NAME = 'knowbeat-nightly-dvv';
const PAGE_SIZE = 500;
const TABLES = ['User', 'Binnacle'];
const TIME_ZONE = process.env.DVV_TIME_ZONE || 'America/Argentina/Buenos_Aires';
const SCHEDULE_HOUR = Number(process.env.DVV_SCHEDULE_HOUR ?? 2);
const SCHEDULE_MINUTE = Number(process.env.DVV_SCHEDULE_MINUTE ?? 0);

const log = (level, event, details = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        event,
        ...details
    };
    console.log(JSON.stringify(entry));
};

const requiredEnvironment = [
    'SQL_DATABASE_HOST',
    'SQL_DATABASE_PORT',
    'SQL_BACKEND_USER',
    'SQL_BACKEND_PASSWORD',
    'SQL_DATABASE_NAME'
];

for (const name of requiredEnvironment) {
    if (!process.env[name]) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
}

if (!Number.isInteger(SCHEDULE_HOUR) || SCHEDULE_HOUR < 0 || SCHEDULE_HOUR > 23) {
    throw new RangeError('DVV_SCHEDULE_HOUR must be an integer from 0 to 23');
}
if (!Number.isInteger(SCHEDULE_MINUTE) || SCHEDULE_MINUTE < 0 || SCHEDULE_MINUTE > 59) {
    throw new RangeError('DVV_SCHEDULE_MINUTE must be an integer from 0 to 59');
}

const pool = mysql.createPool({
    host: process.env.SQL_DATABASE_HOST,
    port: Number(process.env.SQL_DATABASE_PORT),
    user: process.env.SQL_BACKEND_USER,
    password: process.env.SQL_BACKEND_PASSWORD,
    database: process.env.SQL_DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    dateStrings: true,
    timezone: 'Z'
});

const verifyDvvSchema = async () => {
    const [columns] = await pool.query(
        `SELECT COLUMN_NAME, IS_NULLABLE
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'DVV'`,
        [process.env.SQL_DATABASE_NAME]
    );
    const columnMap = new Map(columns.map(({ COLUMN_NAME, IS_NULLABLE }) => [COLUMN_NAME, IS_NULLABLE]));

    if (!columnMap.has('table_name') || !columnMap.has('dvv_value') ||
        columnMap.get('snapshot_at') !== 'NO') {
        throw new Error('DVV schema is outdated; update mysql/init/001-tables.sql and the existing database');
    }

    const [indexes] = await pool.query(
        `SELECT NON_UNIQUE, COLUMN_NAME
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'DVV'
           AND INDEX_NAME = 'uq_dvv_table_name'`,
        [process.env.SQL_DATABASE_NAME]
    );
    if (!indexes.some(({ NON_UNIQUE, COLUMN_NAME }) => NON_UNIQUE === 0 && COLUMN_NAME === 'table_name')) {
        throw new Error('DVV unique index is missing; update mysql/init/001-tables.sql and the existing database');
    }
};

const calculateTableDvv = async (connection, tableName) => {
    const accumulator = createDVVAccumulator();
    let lastId = 0;
    let rowCount = 0;

    while (true) {
        const [rows] = await connection.query(
            `SELECT id, dvh FROM \`${tableName}\` WHERE id > ? ORDER BY id LIMIT ?`,
            [lastId, PAGE_SIZE]
        );

        for (const row of rows) {
            accumulator.addHash(row.dvh);
            lastId = row.id;
            rowCount += 1;
        }

        if (rows.length < PAGE_SIZE) {
            break;
        }
    }

    return { tableName, dvvValue: accumulator.value(), rowCount };
};

const runBatch = async () => {
    const startedAt = new Date().toISOString();
    let connection;
    let lockAcquired = false;
    let transactionOpen = false;

    log('info', 'dvv_run_started', { startedAt });

    try {
        connection = await pool.getConnection();
        const [lockRows] = await connection.query('SELECT GET_LOCK(?, 0) AS acquired', [LOCK_NAME]);
        if (lockRows[0].acquired === 0) {
            log('warn', 'dvv_run_skipped_lock_held', { startedAt });
            return;
        }
        if (lockRows[0].acquired !== 1) {
            throw new Error('MySQL did not confirm acquisition of the DVV worker lock');
        }
        lockAcquired = true;

        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
        transactionOpen = true;

        const [snapshotRows] = await connection.query(
            "SELECT DATE_FORMAT(UTC_TIMESTAMP(6), '%Y-%m-%d %H:%i:%s.%f') AS snapshot_at"
        );
        const snapshotAt = snapshotRows[0].snapshot_at;
        const results = [];

        for (const tableName of TABLES) {
            results.push(await calculateTableDvv(connection, tableName));
        }

        await connection.commit();
        transactionOpen = false;

        await connection.beginTransaction();
        transactionOpen = true;
        for (const result of results) {
            await connection.query(
                `INSERT INTO DVV (table_name, dvv_value, snapshot_at)
                 VALUES (?, ?, ?)
                 AS new_value
                 ON DUPLICATE KEY UPDATE
                   dvv_value = new_value.dvv_value,
                   snapshot_at = new_value.snapshot_at`,
                [result.tableName, result.dvvValue, snapshotAt]
            );
        }
        await connection.commit();
        transactionOpen = false;

        log('info', 'dvv_run_completed', {
            startedAt,
            snapshotAt,
            tables: results.map(({ tableName, dvvValue, rowCount }) => ({
                tableName,
                dvvValue,
                rowCount
            }))
        });
    } catch (error) {
        if (connection && transactionOpen) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                log('error', 'dvv_rollback_failed', { message: rollbackError.message });
            }
        }
        log('error', 'dvv_run_failed', {
            startedAt,
            message: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        if (connection && lockAcquired) {
            try {
                const [releaseRows] = await connection.query('SELECT RELEASE_LOCK(?) AS released', [LOCK_NAME]);
                if (releaseRows[0].released !== 1) {
                    log('error', 'dvv_lock_release_unconfirmed', { startedAt });
                }
            } catch (error) {
                log('error', 'dvv_lock_release_failed', { startedAt, message: error.message });
            }
        }
        if (connection) {
            connection.release();
        }
    }
};

const scheduleNextRun = () => {
    const nextRun = nextScheduledRun(new Date(), TIME_ZONE, SCHEDULE_HOUR, SCHEDULE_MINUTE);
    const delay = Math.max(0, nextRun.getTime() - Date.now());
    log('info', 'dvv_run_scheduled', {
        nextRunLocal: formatLocalDateTime(nextRun, TIME_ZONE),
        nextRunAtUtc: nextRun.toISOString(),
        timeZone: TIME_ZONE
    });

    setTimeout(async () => {
        try {
            await runBatch();
        } catch (error) {
            log('error', 'dvv_scheduler_run_rejected', {
                message: error.message,
                nextAttempt: 'next scheduled run'
            });
        }
        scheduleNextRun();
    }, delay);
};

const start = async () => {
    await pool.query('SELECT 1');
    await verifyDvvSchema();
    log('info', 'dvv_worker_ready', {
        timeZone: TIME_ZONE,
        schedule: `${String(SCHEDULE_HOUR).padStart(2, '0')}:${String(SCHEDULE_MINUTE).padStart(2, '0')}`
    });
    scheduleNextRun();
};

start().catch(async (error) => {
    log('error', 'dvv_worker_start_failed', { message: error.message, stack: error.stack });
    await pool.end();
    process.exitCode = 1;
});

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { createGzip, createGunzip } = require('node:zlib');
const { pipeline } = require('node:stream/promises');
const { Writable } = require('node:stream');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const { nextWeeklyScheduledRun, formatLocalDateTime } = require('./schedule');

const LOCK_NAME = 'knowbeat-database-backup-restore';
const BACKUP_TIME_ZONE = process.env.BACKUP_TIME_ZONE || 'America/Argentina/Buenos_Aires';
const BACKUP_DAY_OF_WEEK = Number(process.env.BACKUP_DAY_OF_WEEK ?? 0);
const BACKUP_SCHEDULE_HOUR = Number(process.env.BACKUP_SCHEDULE_HOUR ?? 3);
const BACKUP_SCHEDULE_MINUTE = Number(process.env.BACKUP_SCHEDULE_MINUTE ?? 0);
const BACKUP_RETENTION_WEEKS = Number(process.env.BACKUP_RETENTION_WEEKS ?? 8);
const BACKUP_DIR = process.env.BACKUP_DIR || '/backups';
const PUBLIC_BUCKETS = new Set(['profiles', 'courses', 'posts']);
const BACKUP_ID_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/;

const log = (level, event, details = {}) => {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event,
        ...details
    }));
};

const validateConfiguration = () => {
    const required = [
        'SQL_DATABASE_SOCKET_PATH',
        'SQL_DATABASE_NAME',
        'SQL_ROOT_PASSWORD',
        'MONGO_DATABASE_HOST',
        'MONGO_DATABASE_PORT',
        'MONGO_DATABASE_NAME',
        'MONGO_ROOT_USER',
        'MONGO_ROOT_PASSWORD',
        'MINIO_ENDPOINT',
        'MINIO_ROOT_USER',
        'MINIO_ROOT_PASSWORD'
    ];

    for (const name of required) {
        if (!process.env[name]) {
            throw new Error(`Missing required environment variable: ${name}`);
        }
    }

    if (!/^[A-Za-z0-9_$-]+$/.test(process.env.SQL_DATABASE_NAME)) {
        throw new Error('SQL_DATABASE_NAME contains unsupported characters');
    }
    if (['information_schema', 'mysql', 'performance_schema', 'sys']
        .includes(process.env.SQL_DATABASE_NAME.toLowerCase())) {
        throw new Error('SQL_DATABASE_NAME cannot be a MySQL system database');
    }
    if (!/^[A-Za-z0-9_-]+$/.test(process.env.MONGO_DATABASE_NAME)) {
        throw new Error('MONGO_DATABASE_NAME contains unsupported characters');
    }
    if (['admin', 'config', 'local'].includes(process.env.MONGO_DATABASE_NAME.toLowerCase())) {
        throw new Error('MONGO_DATABASE_NAME cannot be a MongoDB system database');
    }
    for (const [name, value] of [['MONGO_DATABASE_PORT', process.env.MONGO_DATABASE_PORT]]) {
        if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
            throw new RangeError(`${name} must be a valid TCP port`);
        }
    }
    const minioEndpoint = new URL(process.env.MINIO_ENDPOINT);
    if (!['http:', 'https:'].includes(minioEndpoint.protocol)) {
        throw new Error('MINIO_ENDPOINT must use HTTP or HTTPS');
    }
    if (!Number.isInteger(BACKUP_DAY_OF_WEEK) || BACKUP_DAY_OF_WEEK < 0 || BACKUP_DAY_OF_WEEK > 6) {
        throw new RangeError('BACKUP_DAY_OF_WEEK must be an integer from 0 (Sunday) to 6 (Saturday)');
    }
    if (!Number.isInteger(BACKUP_SCHEDULE_HOUR) || BACKUP_SCHEDULE_HOUR < 0 || BACKUP_SCHEDULE_HOUR > 23) {
        throw new RangeError('BACKUP_SCHEDULE_HOUR must be an integer from 0 to 23');
    }
    if (!Number.isInteger(BACKUP_SCHEDULE_MINUTE) || BACKUP_SCHEDULE_MINUTE < 0 || BACKUP_SCHEDULE_MINUTE > 59) {
        throw new RangeError('BACKUP_SCHEDULE_MINUTE must be an integer from 0 to 59');
    }
    if (!Number.isInteger(BACKUP_RETENTION_WEEKS) || BACKUP_RETENTION_WEEKS < 1) {
        throw new RangeError('BACKUP_RETENTION_WEEKS must be a positive integer');
    }
};

const waitForClose = (child, command) => new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
        if (code === 0) {
            resolve();
        } else {
            reject(new Error(`${command} failed (exit code ${code}, signal ${signal || 'none'})`));
        }
    });
});

const runCommand = async (command, args, { env = process.env, captureStdout = false } = {}) => {
    const child = spawn(command, args, {
        env,
        stdio: ['ignore', captureStdout ? 'pipe' : 'ignore', 'pipe']
    });
    const stderr = [];
    let stderrBytes = 0;
    child.stderr.on('data', (chunk) => {
        if (stderrBytes < 16_384) {
            stderr.push(chunk);
            stderrBytes += chunk.length;
        }
    });
    const stdout = [];
    if (captureStdout) {
        child.stdout.on('data', (chunk) => stdout.push(chunk));
    }

    try {
        await waitForClose(child, command);
    } catch (error) {
        const message = Buffer.concat(stderr).toString('utf8').trim();
        throw new Error(message ? `${error.message}: ${message}` : error.message, { cause: error });
    }
    return captureStdout ? Buffer.concat(stdout).toString('utf8') : '';
};

const createMysqlCredentialsFile = async (directory) => {
    const escapeOptionValue = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const contents = [
        '[client]',
        `socket="${escapeOptionValue(process.env.SQL_DATABASE_SOCKET_PATH)}"`,
        'user="root"',
        `password="${escapeOptionValue(process.env.SQL_ROOT_PASSWORD)}"`,
        'default-character-set=utf8mb4',
        ''
    ].join('\n');
    const filePath = path.join(directory, 'mysql-client.cnf');
    await fsp.writeFile(filePath, contents, { mode: 0o600, flag: 'wx' });
    return filePath;
};

const createMongoConfigFile = async (directory) => {
    const contents = [
        `password: ${JSON.stringify(process.env.MONGO_ROOT_PASSWORD)}`,
        ''
    ].join('\n');
    const filePath = path.join(directory, 'mongodb-tools.yml');
    await fsp.writeFile(filePath, contents, { mode: 0o600, flag: 'wx' });
    return filePath;
};

const withDatabaseLock = async (action) => {
    const connection = await mysql.createConnection({
        socketPath: process.env.SQL_DATABASE_SOCKET_PATH,
        user: 'root',
        password: process.env.SQL_ROOT_PASSWORD,
        connectTimeout: 10_000
    });
    let acquired = false;

    try {
        await connection.query('SET SESSION wait_timeout = 604800');
        const [rows] = await connection.query('SELECT GET_LOCK(?, 0) AS acquired', [LOCK_NAME]);
        if (rows[0].acquired !== 1) {
            throw new Error('Another backup or restore is already running');
        }
        acquired = true;
        return await action(connection);
    } finally {
        if (acquired) {
            try {
                const [rows] = await connection.query('SELECT RELEASE_LOCK(?) AS released', [LOCK_NAME]);
                if (rows[0].released !== 1) {
                    log('error', 'backup_lock_release_unconfirmed');
                }
            } catch (error) {
                log('error', 'backup_lock_release_failed', { message: error.message });
            }
        }
        try {
            await connection.end();
        } catch (error) {
            log('error', 'backup_lock_connection_close_failed', { message: error.message });
        }
    }
};

const listMinioBuckets = async (mcEnvironment) => {
    const output = await runCommand('mc', ['ls', '--json', 'local'], {
        env: mcEnvironment,
        captureStdout: true
    });
    const buckets = [];

    for (const line of output.split(/\r?\n/).filter(Boolean)) {
        const item = JSON.parse(line);
        if (item.type !== 'folder' || typeof item.key !== 'string') {
            continue;
        }
        const bucket = item.key.replace(/\/$/, '');
        if (!bucket || bucket.includes('/') || bucket === '.' || bucket === '..') {
            throw new Error(`MinIO returned an invalid bucket name: ${JSON.stringify(item.key)}`);
        }
        buckets.push(bucket);
    }

    return [...new Set(buckets)].sort();
};

const createMcEnvironment = async (directory) => {
    const configDirectory = path.join(directory, 'mc-config');
    await fsp.mkdir(configDirectory, { mode: 0o700 });
    const environment = {
        ...process.env,
        MC_CONFIG_DIR: configDirectory
    };
    await runCommand('mc', [
        'alias',
        'set',
        'local',
        process.env.MINIO_ENDPOINT,
        process.env.MINIO_ROOT_USER,
        process.env.MINIO_ROOT_PASSWORD
    ], { env: environment });
    return environment;
};

const dumpMysql = async (credentialsFile, outputFile) => {
    const child = spawn('mysqldump', [
        `--defaults-extra-file=${credentialsFile}`,
        '--single-transaction',
        '--routines',
        '--events',
        '--triggers',
        '--hex-blob',
        '--databases',
        process.env.SQL_DATABASE_NAME
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
        if (stderr.length < 16_384) {
            stderr += chunk.toString('utf8');
        }
    });

    try {
        await Promise.all([
            pipeline(child.stdout, createGzip(), fs.createWriteStream(outputFile, { flags: 'wx' })),
            waitForClose(child, 'mysqldump')
        ]);
    } catch (error) {
        child.kill();
        const detail = stderr.trim();
        throw new Error(detail ? `${error.message}: ${detail}` : error.message, { cause: error });
    }
};

const dumpMongo = async (configFile, outputFile) => {
    const child = spawn('mongodump', [
        `--config=${configFile}`,
        `--host=${process.env.MONGO_DATABASE_HOST}`,
        `--port=${process.env.MONGO_DATABASE_PORT}`,
        `--username=${process.env.MONGO_ROOT_USER}`,
        '--authenticationDatabase=admin',
        `--db=${process.env.MONGO_DATABASE_NAME}`,
        `--archive=${outputFile}`,
        '--gzip'
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
        if (stderr.length < 16_384) {
            stderr += chunk.toString('utf8');
        }
    });

    try {
        await waitForClose(child, 'mongodump');
    } catch (error) {
        const detail = stderr.trim();
        throw new Error(detail ? `${error.message}: ${detail}` : error.message, { cause: error });
    }
};

const walkFiles = async (directory) => {
    const files = [];
    const entries = await fsp.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await walkFiles(fullPath));
        } else if (entry.isFile()) {
            files.push(fullPath);
        } else {
            throw new Error(`Unexpected non-file in backup: ${fullPath}`);
        }
    }
    return files;
};

const hashFile = async (filePath) => {
    const hash = crypto.createHash('sha256');
    let size = 0;
    for await (const chunk of fs.createReadStream(filePath)) {
        hash.update(chunk);
        size += chunk.length;
    }
    return { sha256: hash.digest('hex'), size };
};

const validateGzipFile = async (filePath) => {
    await pipeline(
        fs.createReadStream(filePath),
        createGunzip(),
        new Writable({ write(_chunk, _encoding, callback) { callback(); } })
    );
};

const createManifest = async (directory, details) => {
    const files = {};
    for (const filePath of (await walkFiles(directory)).sort()) {
        const relativePath = path.relative(directory, filePath).split(path.sep).join('/');
        files[relativePath] = await hashFile(filePath);
    }
    const manifest = {
        formatVersion: 1,
        createdAt: new Date().toISOString(),
        consistency: 'Each service is backed up independently while the application may be writing.',
        mysqlDatabase: process.env.SQL_DATABASE_NAME,
        mongoDatabase: process.env.MONGO_DATABASE_NAME,
        buckets: details.buckets.map((name) => ({
            name,
            anonymousAccess: PUBLIC_BUCKETS.has(name) ? 'download' : 'private'
        })),
        files
    };
    await fsp.writeFile(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, {
        flag: 'wx'
    });
    return manifest;
};

const validateBackup = async (directory) => {
    const manifestPath = path.join(directory, 'manifest.json');
    const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
    if (manifest.formatVersion !== 1 ||
        manifest.mysqlDatabase !== process.env.SQL_DATABASE_NAME ||
        manifest.mongoDatabase !== process.env.MONGO_DATABASE_NAME ||
        !Array.isArray(manifest.buckets) ||
        !manifest.files ||
        typeof manifest.files !== 'object') {
        throw new Error('Backup manifest is invalid or does not match the configured databases');
    }

    for (const requiredFile of ['mysql.sql.gz', 'mongo.archive.gz']) {
        if (!Object.hasOwn(manifest.files, requiredFile)) {
            throw new Error(`Backup manifest is missing ${requiredFile}`);
        }
    }
    const bucketNames = new Set();
    for (const bucket of manifest.buckets) {
        if (!bucket || typeof bucket.name !== 'string' ||
            bucket.name.includes('/') || bucket.name.includes('\\') ||
            bucket.name === '.' || bucket.name === '..' ||
            bucketNames.has(bucket.name) ||
            !['download', 'private'].includes(bucket.anonymousAccess)) {
            throw new Error('Backup manifest contains an invalid MinIO bucket');
        }
        bucketNames.add(bucket.name);
        const bucketPath = path.join(directory, 'minio', bucket.name);
        if (!(await fsp.lstat(bucketPath)).isDirectory()) {
            throw new Error(`Backup is missing the MinIO bucket directory: ${bucket.name}`);
        }
    }

    const listedFiles = new Set(Object.keys(manifest.files));
    for (const [relativePath, expected] of Object.entries(manifest.files)) {
        if (path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes('..')) {
            throw new Error(`Backup manifest contains an unsafe path: ${relativePath}`);
        }
        const filePath = path.resolve(directory, relativePath);
        if (!filePath.startsWith(`${path.resolve(directory)}${path.sep}`)) {
            throw new Error(`Backup manifest contains an unsafe path: ${relativePath}`);
        }
        const fileStat = await fsp.lstat(filePath);
        if (!fileStat.isFile()) {
            throw new Error(`Backup entry is not a regular file: ${relativePath}`);
        }
        const actual = await hashFile(filePath);
        if (actual.sha256 !== expected.sha256 || actual.size !== expected.size) {
            throw new Error(`Backup file failed checksum validation: ${relativePath}`);
        }
    }
    for (const filePath of await walkFiles(directory)) {
        const relativePath = path.relative(directory, filePath).split(path.sep).join('/');
        if (relativePath !== 'manifest.json' && !listedFiles.has(relativePath)) {
            throw new Error(`Backup contains an unlisted file: ${relativePath}`);
        }
    }
    await validateGzipFile(path.join(directory, 'mysql.sql.gz'));
    await validateGzipFile(path.join(directory, 'mongo.archive.gz'));
    return manifest;
};

const backupOnce = async () => withDatabaseLock(async () => {
    await fsp.mkdir(BACKUP_DIR, { recursive: true });
    const startedAt = new Date();
    const backupId = startedAt.toISOString().replace(/[:.]/g, '-');
    const finalDirectory = path.join(BACKUP_DIR, backupId);
    await removeIncompleteBackups();
    const stagingDirectory = await fsp.mkdtemp(path.join(BACKUP_DIR, '.incomplete-'));
    let credentialsDirectory;

    log('info', 'backup_started', { backupId });
    try {
        credentialsDirectory = await fsp.mkdtemp(path.join(os.tmpdir(), 'knowbeat-backup-'));
        const mysqlCredentials = await createMysqlCredentialsFile(credentialsDirectory);
        const mongoConfig = await createMongoConfigFile(credentialsDirectory);
        const mcEnvironment = await createMcEnvironment(credentialsDirectory);
        const bucketNames = await listMinioBuckets(mcEnvironment);

        await dumpMysql(mysqlCredentials, path.join(stagingDirectory, 'mysql.sql.gz'));
        await dumpMongo(mongoConfig, path.join(stagingDirectory, 'mongo.archive.gz'));

        const minioDirectory = path.join(stagingDirectory, 'minio');
        await fsp.mkdir(minioDirectory);
        for (const bucket of bucketNames) {
            await fsp.mkdir(path.join(minioDirectory, bucket));
            await runCommand('mc', [
                'mirror',
                '--overwrite',
                '--preserve',
                `local/${bucket}`,
                path.join(minioDirectory, bucket)
            ], { env: mcEnvironment });
        }

        await createManifest(stagingDirectory, { buckets: bucketNames });
        await fsp.rename(stagingDirectory, finalDirectory);
        try {
            await pruneOldBackups();
        } catch (error) {
            log('error', 'backup_retention_failed', { backupId, message: error.message });
        }
        log('info', 'backup_completed', { backupId, buckets: bucketNames.length });
    } catch (error) {
        await fsp.rm(stagingDirectory, { recursive: true, force: true });
        log('error', 'backup_failed', { backupId, message: error.message, stack: error.stack });
        throw error;
    } finally {
        if (credentialsDirectory) {
            await fsp.rm(credentialsDirectory, { recursive: true, force: true });
        }
    }
});

const removeIncompleteBackups = async () => {
    const entries = await fsp.readdir(BACKUP_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('.incomplete-')) {
            await fsp.rm(path.join(BACKUP_DIR, entry.name), { recursive: true, force: true });
        }
    }
};

const listBackupDirectories = async () => {
    await fsp.mkdir(BACKUP_DIR, { recursive: true });
    const entries = await fsp.readdir(BACKUP_DIR, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isDirectory() && BACKUP_ID_PATTERN.test(entry.name))
        .map((entry) => entry.name)
        .sort()
        .reverse();
};

const pruneOldBackups = async () => {
    const backupIds = await listBackupDirectories();
    for (const backupId of backupIds.slice(BACKUP_RETENTION_WEEKS)) {
        await fsp.rm(path.join(BACKUP_DIR, backupId), { recursive: true });
        log('info', 'backup_expired', { backupId });
    }
};

const restoreMysql = async (credentialsFile, backupDirectory) => {
    const database = process.env.SQL_DATABASE_NAME;
    await runCommand('mysql', [
        `--defaults-extra-file=${credentialsFile}`,
        '-e',
        `DROP DATABASE IF EXISTS \`${database}\`; CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4;`
    ]);

    const child = spawn('mysql', [`--defaults-extra-file=${credentialsFile}`], {
        stdio: ['pipe', 'ignore', 'pipe']
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
        if (stderr.length < 16_384) {
            stderr += chunk.toString('utf8');
        }
    });
    try {
        await Promise.all([
            pipeline(
                fs.createReadStream(path.join(backupDirectory, 'mysql.sql.gz')),
                createGunzip(),
                child.stdin
            ),
            waitForClose(child, 'mysql restore')
        ]);
    } catch (error) {
        child.kill();
        const detail = stderr.trim();
        throw new Error(detail ? `${error.message}: ${detail}` : error.message, { cause: error });
    }
};

const restoreMongo = async (mongoConfig, backupDirectory) => {
    const uri = `mongodb://${encodeURIComponent(process.env.MONGO_ROOT_USER)}:${encodeURIComponent(process.env.MONGO_ROOT_PASSWORD)}` +
        `@${process.env.MONGO_DATABASE_HOST}:${process.env.MONGO_DATABASE_PORT}/?authSource=admin`;
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
    try {
        await client.connect();
        await client.db(process.env.MONGO_DATABASE_NAME).dropDatabase();
    } finally {
        await client.close();
    }

    await runCommand('mongorestore', [
        `--config=${mongoConfig}`,
        `--host=${process.env.MONGO_DATABASE_HOST}`,
        `--port=${process.env.MONGO_DATABASE_PORT}`,
        `--username=${process.env.MONGO_ROOT_USER}`,
        '--authenticationDatabase=admin',
        `--nsInclude=${process.env.MONGO_DATABASE_NAME}.*`,
        `--archive=${path.join(backupDirectory, 'mongo.archive.gz')}`,
        '--gzip'
    ]);
};

const restoreMinio = async (mcEnvironment, backupDirectory, manifest) => {
    const currentBuckets = await listMinioBuckets(mcEnvironment);

    for (const bucket of currentBuckets) {
        await runCommand('mc', ['rb', '--force', `local/${bucket}`], { env: mcEnvironment });
    }
    for (const bucket of manifest.buckets) {
        await runCommand('mc', ['mb', `local/${bucket.name}`], { env: mcEnvironment });
        const policy = bucket.anonymousAccess === 'download' ? 'download' : 'private';
        await runCommand('mc', ['anonymous', 'set', policy, `local/${bucket.name}`], { env: mcEnvironment });
        await runCommand('mc', [
            'mirror',
            '--overwrite',
            '--preserve',
            path.join(backupDirectory, 'minio', bucket.name),
            `local/${bucket.name}`
        ], { env: mcEnvironment });
    }
    log('info', 'restore_minio_buckets_recreated', { count: manifest.buckets.length });
};

const restoreBackup = async (backupId, confirmed) => {
    if (!confirmed) {
        throw new Error('Restore requires the --confirm-replace flag');
    }
    if (!BACKUP_ID_PATTERN.test(backupId)) {
        throw new Error('Backup ID has an invalid format');
    }

    const backupDirectory = path.join(BACKUP_DIR, backupId);
    await withDatabaseLock(async () => {
        const manifest = await validateBackup(backupDirectory);
        log('warn', 'restore_started', {
            backupId,
            mysqlDatabase: manifest.mysqlDatabase,
            mongoDatabase: manifest.mongoDatabase,
            bucketCount: manifest.buckets.length,
            destructive: true
        });

        const credentialsDirectory = await fsp.mkdtemp(path.join(os.tmpdir(), 'knowbeat-restore-'));
        try {
            const mysqlCredentials = await createMysqlCredentialsFile(credentialsDirectory);
            const mongoConfig = await createMongoConfigFile(credentialsDirectory);
            const mcEnvironment = await createMcEnvironment(credentialsDirectory);
            await restoreMysql(mysqlCredentials, backupDirectory);
            await restoreMongo(mongoConfig, backupDirectory);
            await restoreMinio(mcEnvironment, backupDirectory, manifest);
        } finally {
            await fsp.rm(credentialsDirectory, { recursive: true, force: true });
        }
    });
    log('info', 'restore_completed', { backupId });
};

const scheduleNextBackup = () => {
    const nextRun = nextWeeklyScheduledRun(
        new Date(),
        BACKUP_TIME_ZONE,
        BACKUP_DAY_OF_WEEK,
        BACKUP_SCHEDULE_HOUR,
        BACKUP_SCHEDULE_MINUTE
    );
    const delay = Math.max(0, nextRun.getTime() - Date.now());
    log('info', 'backup_scheduled', {
        nextRunLocal: formatLocalDateTime(nextRun, BACKUP_TIME_ZONE),
        nextRunAtUtc: nextRun.toISOString(),
        timeZone: BACKUP_TIME_ZONE
    });

    setTimeout(async () => {
        await runScheduledBackup();
        scheduleNextBackup();
    }, delay);
};

const runScheduledBackup = async () => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            await backupOnce();
            return;
        } catch (error) {
            log('error', 'backup_scheduler_run_failed', {
                attempt,
                message: error.message,
                nextAttempt: attempt < 3 ? 'in 60 seconds' : 'next scheduled run'
            });
            if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, 60_000));
            }
        }
    }
};

const main = async () => {
    validateConfiguration();
    const [action, backupId, confirmation] = process.argv.slice(2);
    if (action === 'restore') {
        await restoreBackup(backupId, confirmation === '--confirm-replace');
        return;
    }
    if (action === 'list') {
        for (const id of await listBackupDirectories()) {
            console.log(id);
        }
        return;
    }
    if (action) {
        throw new Error(`Unsupported command: ${action}`);
    }

    await fsp.mkdir(BACKUP_DIR, { recursive: true });
    log('info', 'backup_worker_ready', {
        schedule: 'weekly',
        dayOfWeek: BACKUP_DAY_OF_WEEK,
        time: `${String(BACKUP_SCHEDULE_HOUR).padStart(2, '0')}:${String(BACKUP_SCHEDULE_MINUTE).padStart(2, '0')}`,
        timeZone: BACKUP_TIME_ZONE,
        retentionWeeks: BACKUP_RETENTION_WEEKS
    });
    scheduleNextBackup();
};

if (require.main === module) {
    main().catch((error) => {
        log('error', 'backup_worker_failed', { message: error.message, stack: error.stack });
        process.exitCode = 1;
    });
}

module.exports = {
    BACKUP_ID_PATTERN,
    createManifest,
    nextWeeklyScheduledRun,
    validateBackup
};

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const { createManifest, validateBackup } = require('./index');

process.env.SQL_DATABASE_NAME = 'knowbeat';
process.env.MONGO_DATABASE_NAME = 'knowbeat';

const createBackupFixture = async (t) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'knowbeat-backup-test-'));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    await fs.writeFile(path.join(directory, 'mysql.sql.gz'), gzipSync('mysql backup'));
    await fs.writeFile(path.join(directory, 'mongo.archive.gz'), gzipSync('mongo backup'));
    await fs.mkdir(path.join(directory, 'minio', 'profiles'), { recursive: true });
    await fs.writeFile(path.join(directory, 'minio', 'profiles', 'default.webp'), 'image data');
    return directory;
};

test('creates and validates checksums for a complete backup', async (t) => {
    const directory = await createBackupFixture(t);
    await createManifest(directory, { buckets: ['profiles'] });

    const manifest = await validateBackup(directory);

    assert.equal(manifest.formatVersion, 1);
    assert.equal(manifest.buckets[0].anonymousAccess, 'download');
    assert.equal(Object.keys(manifest.files).length, 3);
});

test('rejects a backup whose content changed after its manifest was written', async (t) => {
    const directory = await createBackupFixture(t);
    await createManifest(directory, { buckets: ['profiles'] });
    await fs.appendFile(path.join(directory, 'mysql.sql.gz'), 'tampered');

    await assert.rejects(validateBackup(directory), /checksum validation/);
});

test('rejects files added after a backup was completed', async (t) => {
    const directory = await createBackupFixture(t);
    await createManifest(directory, { buckets: ['profiles'] });
    await fs.writeFile(path.join(directory, 'unexpected.txt'), 'not in manifest');

    await assert.rejects(validateBackup(directory), /unlisted file/);
});

test('rejects a compressed archive that is corrupt even if its checksum matches', async (t) => {
    const directory = await createBackupFixture(t);
    await fs.writeFile(path.join(directory, 'mongo.archive.gz'), 'not gzip data');
    await createManifest(directory, { buckets: ['profiles'] });

    await assert.rejects(validateBackup(directory));
});

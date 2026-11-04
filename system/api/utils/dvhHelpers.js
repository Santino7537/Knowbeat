const crypto = require('crypto');
const CRC32 = require('crc-32');

const computeDVHFromObject = (obj) => {
    const values = Object.values(obj).map(v => (v === undefined || v === null) ? '' : String(v));

    return crypto.createHash('sha256').update(values.join(''), 'utf8').digest('hex');
};

const crc32FromHex = (hex) => {
    const buf = Buffer.from(hex, 'hex');
    const signed = CRC32.buf(buf);
    return (signed >>> 0);
};

const createDVVAccumulator = () => {
    let checksum = 0;

    return {
        addHash: (hash) => {
            if (typeof hash !== 'string' || !/^[\da-f]{64}$/i.test(hash)) {
                throw new Error('DVH must be a 64-character hexadecimal SHA-256 hash');
            }

            checksum = CRC32.buf(Buffer.from(hash, 'hex'), checksum);
        },
        value: () => checksum >>> 0
    };
};

module.exports = {
    computeDVHFromObject,
    crc32FromHex,
    createDVVAccumulator
};
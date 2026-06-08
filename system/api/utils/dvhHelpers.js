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

module.exports = {
    computeDVHFromObject,
    crc32FromHex
};
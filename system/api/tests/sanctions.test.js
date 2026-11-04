const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ALLOWED_TEMPORARY_DURATIONS,
  getSanctionExpiry,
  getActiveSanction,
  toSuspensionResponse
} = require('../utils/sanctions');

const fixedNow = new Date('2026-11-04T15:00:00.000Z');

test('allows only the documented temporary durations', () => {
  assert.deepEqual(ALLOWED_TEMPORARY_DURATIONS, [1, 3, 7, 15, 30, 60, 90]);
  assert.equal(getSanctionExpiry({ type: 'temporary', durationDays: 7 }, fixedNow).expiresAt,
    '2026-11-11 15:00:00');
  assert.match(getSanctionExpiry({ type: 'temporary', durationDays: 2 }, fixedNow).error, /duración/);
  assert.match(getSanctionExpiry({ type: 'temporary', durationDays: '7' }, fixedNow).error, /duración/);
});

test('validates custom dates against the current UTC date and maximum duration', () => {
  assert.equal(getSanctionExpiry({ type: 'temporary', endDate: '2026-11-05' }, fixedNow).expiresAt,
    '2026-11-05 23:59:59');
  assert.match(getSanctionExpiry({ type: 'temporary', endDate: '2026-11-04' }, fixedNow).error, /futura/);
  assert.match(getSanctionExpiry({ type: 'temporary', endDate: '2027-02-03' }, fixedNow).error, /90 días/);
  assert.match(getSanctionExpiry({ type: 'temporary', endDate: '2026-02-31' }, fixedNow).error, /no es válida/);
});

test('represents permanent sanctions explicitly without relying on a far-future date', () => {
  assert.deepEqual(
    getSanctionExpiry({ type: 'permanent' }, fixedNow),
    { isPermanent: true, expiresAt: null, penaltyDate: null }
  );
});

test('returns only safe suspension details', () => {
  assert.deepEqual(
    toSuspensionResponse({
      id: 8,
      is_permanent: 0,
      expires_at: '2026-11-11T15:00:00.000Z',
      days_remaining: '7',
      admin_comment: 'Motivo informado'
    }),
    {
      permanent: false,
      expiresAt: '2026-11-11T15:00:00.000Z',
      daysRemaining: 7,
      reason: 'Motivo informado',
      message: 'Tu cuenta está suspendida temporalmente.'
    }
  );
});

test('queries only sanctions that remain active and have not been revoked', async () => {
  let capturedSql = '';
  let capturedValues;
  const expected = { id: 9, is_permanent: 1 };
  const connection = {
    async query(sql, values) {
      capturedSql = sql;
      capturedValues = values;
      return [[expected], []];
    }
  };

  assert.equal(await getActiveSanction(connection, 42), expected);
  assert.match(capturedSql, /revoked_at IS NULL/);
  assert.match(capturedSql, /expires_at > UTC_TIMESTAMP\(\)/);
  assert.deepEqual(capturedValues, [42]);
});

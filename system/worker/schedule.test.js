const test = require('node:test');
const assert = require('node:assert/strict');
const { formatLocalDateTime, nextScheduledRun } = require('./schedule');

const TIME_ZONE = 'America/Argentina/Buenos_Aires';

test('12:02 in Buenos Aires is logged with its UTC equivalent', () => {
    const now = new Date('2026-11-04T14:41:00.000Z');
    const nextRun = nextScheduledRun(now, TIME_ZONE, 12, 2);

    assert.equal(formatLocalDateTime(nextRun, TIME_ZONE), '2026-11-04 12:02:00');
    assert.equal(nextRun.toISOString(), '2026-11-04T15:02:00.000Z');
});

test('a passed local schedule moves to the following day', () => {
    const now = new Date('2026-11-04T15:03:00.000Z');
    const nextRun = nextScheduledRun(now, TIME_ZONE, 12, 2);

    assert.equal(formatLocalDateTime(nextRun, TIME_ZONE), '2026-11-05 12:02:00');
    assert.equal(nextRun.toISOString(), '2026-11-05T15:02:00.000Z');
});

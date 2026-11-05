const test = require('node:test');
const assert = require('node:assert/strict');
const { formatLocalDateTime, nextWeeklyScheduledRun } = require('./schedule');

const TIME_ZONE = 'America/Argentina/Buenos_Aires';

test('schedules Sunday at 03:00 in Buenos Aires with its UTC equivalent', () => {
    const now = new Date('2026-11-04T14:41:00.000Z');
    const nextRun = nextWeeklyScheduledRun(now, TIME_ZONE, 0, 3, 0);

    assert.equal(formatLocalDateTime(nextRun, TIME_ZONE), '2026-11-08 03:00:00');
    assert.equal(nextRun.toISOString(), '2026-11-08T06:00:00.000Z');
});

test('a passed Sunday schedule moves to the following week', () => {
    const now = new Date('2026-11-08T07:00:00.000Z');
    const nextRun = nextWeeklyScheduledRun(now, TIME_ZONE, 0, 3, 0);

    assert.equal(formatLocalDateTime(nextRun, TIME_ZONE), '2026-11-15 03:00:00');
    assert.equal(nextRun.toISOString(), '2026-11-15T06:00:00.000Z');
});

test('rejects invalid weekly schedule values', () => {
    const now = new Date('2026-11-04T14:41:00.000Z');
    assert.throws(() => nextWeeklyScheduledRun(now, TIME_ZONE, 7, 3, 0), /dayOfWeek/);
    assert.throws(() => nextWeeklyScheduledRun(now, TIME_ZONE, 0, 24, 0), /hour/);
    assert.throws(() => nextWeeklyScheduledRun(now, TIME_ZONE, 0, 3, 60), /minute/);
});

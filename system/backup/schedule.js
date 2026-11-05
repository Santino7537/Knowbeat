const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const createFormatter = (timeZone) => new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23'
});

const getParts = (date, formatter) => Object.fromEntries(
    formatter.formatToParts(date).map(({ type, value }) => [type, value])
);

const localTimestamp = (parts) => Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
    Number(parts.fractionalSecond)
);

const nextWeeklyScheduledRun = (now, timeZone, dayOfWeek, hour, minute) => {
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
        throw new TypeError('now must be a valid Date');
    }
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        throw new RangeError('dayOfWeek must be an integer from 0 (Sunday) to 6 (Saturday)');
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        throw new RangeError('hour must be an integer from 0 to 23');
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
        throw new RangeError('minute must be an integer from 0 to 59');
    }

    const formatter = createFormatter(timeZone);
    const currentParts = getParts(now, formatter);
    const currentLocal = localTimestamp(currentParts);
    const daysUntilRun = (dayOfWeek - WEEKDAYS[currentParts.weekday] + 7) % 7;

    let targetLocal = Date.UTC(
        Number(currentParts.year),
        Number(currentParts.month) - 1,
        Number(currentParts.day) + daysUntilRun,
        hour,
        minute
    );
    if (targetLocal <= currentLocal) {
        targetLocal += WEEK_MS;
    }

    let candidate = targetLocal - (currentLocal - now.getTime());
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const adjustment = targetLocal - localTimestamp(getParts(new Date(candidate), formatter));
        if (adjustment === 0) {
            return new Date(candidate);
        }
        candidate += adjustment;
    }

    throw new Error(`Could not resolve the next scheduled time in ${timeZone}`);
};

const formatLocalDateTime = (date, timeZone) => {
    const parts = getParts(date, createFormatter(timeZone));
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

module.exports = { nextWeeklyScheduledRun, formatLocalDateTime };

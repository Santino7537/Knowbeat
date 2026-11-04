const DAY_MS = 24 * 60 * 60 * 1000;

const createFormatter = (timeZone) => new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23'
});

const localTimestamp = (date, formatter) => {
    const parts = Object.fromEntries(
        formatter.formatToParts(date).map(({ type, value }) => [type, Number(value)])
    );

    return Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
        parts.fractionalSecond
    );
};

const formatLocalDateTime = (date, timeZone) => {
    const formatter = createFormatter(timeZone);
    const parts = Object.fromEntries(
        formatter.formatToParts(date).map(({ type, value }) => [type, value])
    );

    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const nextScheduledRun = (now, timeZone, hour, minute) => {
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
        throw new TypeError('now must be a valid Date');
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        throw new RangeError('hour must be an integer from 0 to 23');
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
        throw new RangeError('minute must be an integer from 0 to 59');
    }

    const formatter = createFormatter(timeZone);
    const currentLocal = localTimestamp(now, formatter);
    const currentParts = Object.fromEntries(
        formatter.formatToParts(now).map(({ type, value }) => [type, Number(value)])
    );

    let targetLocal = Date.UTC(
        currentParts.year,
        currentParts.month - 1,
        currentParts.day,
        hour,
        minute
    );
    if (targetLocal <= currentLocal) {
        targetLocal += DAY_MS;
    }

    let candidate = targetLocal - (currentLocal - now.getTime());
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const adjustment = targetLocal - localTimestamp(new Date(candidate), formatter);
        if (adjustment === 0) {
            return new Date(candidate);
        }
        candidate += adjustment;
    }

    throw new Error(`Could not resolve the next scheduled time in ${timeZone}`);
};

module.exports = { nextScheduledRun, formatLocalDateTime };

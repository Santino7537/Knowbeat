const ALLOWED_TEMPORARY_DURATIONS = [1, 3, 7, 15, 30, 60, 90];
const MAX_CUSTOM_SANCTION_DAYS = 90;

const formatUtcDateTime = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

function getSanctionExpiry(sanction, now = new Date()) {
  if (!sanction || typeof sanction !== 'object') {
    return { error: 'La sanción no es válida.' };
  }

  if (sanction.type === 'permanent') {
    return { isPermanent: true, expiresAt: null, penaltyDate: null };
  }

  if (sanction.type !== 'temporary') {
    return { error: 'El tipo de sanción no es válido.' };
  }

  let expiresAt;
  if (sanction.durationDays !== undefined) {
    const durationDays = sanction.durationDays;
    if (!Number.isInteger(durationDays) || !ALLOWED_TEMPORARY_DURATIONS.includes(durationDays)) {
      return { error: 'La duración de la sanción no es válida.' };
    }
    expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  } else if (typeof sanction.endDate === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(sanction.endDate)) {
    const dateStart = new Date(`${sanction.endDate}T00:00:00.000Z`);
    if (Number.isNaN(dateStart.getTime()) || dateStart.toISOString().slice(0, 10) !== sanction.endDate) {
      return { error: 'La fecha de finalización no es válida.' };
    }

    expiresAt = new Date(`${sanction.endDate}T23:59:59.000Z`);
    const daysFromToday = Math.ceil(
      (dateStart.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      / (24 * 60 * 60 * 1000)
    );
    if (daysFromToday <= 0 || expiresAt <= now || daysFromToday > MAX_CUSTOM_SANCTION_DAYS) {
      return { error: 'La fecha debe ser futura y no superar los 90 días.' };
    }
  } else {
    return { error: 'Elegí una duración o una fecha de finalización válida.' };
  }

  const expiresAtSql = formatUtcDateTime(expiresAt);
  return {
    isPermanent: false,
    expiresAt: expiresAtSql,
    penaltyDate: expiresAtSql.slice(0, 10)
  };
}

async function getActiveSanction(connection, userId) {
  const [rows] = await connection.query(
    `SELECT
       id,
       is_permanent,
       DATE_FORMAT(expires_at, '%Y-%m-%dT%H:%i:%s.000Z') AS expires_at,
       admin_comment,
       GREATEST(1, CEIL(TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), expires_at) / 86400)) AS days_remaining
     FROM UserSanction
     WHERE user_id = ?
       AND revoked_at IS NULL
       AND (is_permanent = 1 OR expires_at > UTC_TIMESTAMP())
     ORDER BY starts_at DESC, id DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] ?? null;
}

function toSuspensionResponse(sanction) {
  if (!sanction) return null;

  const permanent = sanction.is_permanent === true || Number(sanction.is_permanent) === 1;
  return {
    permanent,
    expiresAt: permanent ? null : sanction.expires_at,
    daysRemaining: permanent ? null : Number(sanction.days_remaining),
    reason: sanction.admin_comment,
    message: permanent
      ? 'Tu cuenta tiene una suspensión permanente.'
      : 'Tu cuenta está suspendida temporalmente.'
  };
}

module.exports = {
  ALLOWED_TEMPORARY_DURATIONS,
  getSanctionExpiry,
  getActiveSanction,
  toSuspensionResponse
};

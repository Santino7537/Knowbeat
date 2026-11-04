const {
  ADMINISTRATOR_ROLE,
  REPORT_STATUSES,
  REPORT_FILTER_REASONS,
  PENALTY_DATE,
  LOG_ACTIONS
} = require('../constants');
const { computeDVHFromObject } = require('../utils/dvhHelpers');
const { getActiveSanction, getSanctionExpiry } = require('../utils/sanctions');
const { getIo } = require('../config/socket');
const db = require('../config/db');

const errorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({ status: 'error', message });

const successResponse = (res, statusCode, message, data) =>
  res.status(statusCode).json({ status: 'success', message, ...(data ? { data } : {}) });

const parsePositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const isValidIsoDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const normalizeComment = (value) => {
  if (typeof value !== 'string') return null;
  const comment = value.trim();
  return comment.length >= 10 && comment.length <= 1000 ? comment : null;
};

const requireAdministrator = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ro.role
       FROM User u
       JOIN Role ro ON ro.id = u.role_id
       WHERE u.id = ? AND u.eliminated = 0`,
      [req.user?.user_id]
    );

    if (rows.length === 0) {
      errorResponse(res, 401, 'Usuario no autenticado');
      return false;
    }
    if (rows[0].role !== ADMINISTRATOR_ROLE) {
      errorResponse(res, 403, 'Se requiere permiso de administrador');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error verificando permisos de moderación:', error);
    errorResponse(res, 500, 'No se pudieron verificar los permisos');
    return false;
  }
};

const getReports = async (req, res) => {
  if (!(await requireAdministrator(req, res))) return;

  const {
    status,
    reason,
    search,
    reported_id: reportedIdValue,
    from,
    to,
    page: pageValue = '1',
    limit: limitValue = '20'
  } = req.query;

  const page = parsePositiveInt(pageValue);
  const limit = parsePositiveInt(limitValue);
  if (!page || !limit || limit > 50) {
    return errorResponse(res, 422, 'page y limit deben ser enteros positivos; limit no puede superar 50');
  }
  if (status && !REPORT_STATUSES.includes(status)) {
    return errorResponse(res, 422, 'Estado de reporte inválido');
  }
  if (reason && !REPORT_FILTER_REASONS.includes(reason)) {
    return errorResponse(res, 422, 'Motivo de reporte inválido');
  }
  if (search !== undefined && (typeof search !== 'string' || search.trim().length > 80)) {
    return errorResponse(res, 422, 'La búsqueda no puede superar 80 caracteres');
  }

  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }
  if (reason) {
    conditions.push('r.reason = ?');
    params.push(reason);
  }
  if (reportedIdValue !== undefined && reportedIdValue !== '') {
    const reportedId = parsePositiveInt(reportedIdValue);
    if (!reportedId) return errorResponse(res, 422, 'reported_id inválido');
    conditions.push('r.reported_id = ?');
    params.push(reportedId);
  }
  if (from) {
    if (!isValidIsoDate(from)) return errorResponse(res, 422, 'Fecha from inválida');
    conditions.push('r.date >= ?');
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    if (!isValidIsoDate(to)) return errorResponse(res, 422, 'Fecha to inválida');
    conditions.push('r.date < DATE_ADD(?, INTERVAL 1 DAY)');
    params.push(`${to} 00:00:00`);
  }
  if (from && to && from > to) {
    return errorResponse(res, 422, 'El rango de fechas es inválido');
  }
  if (search?.trim()) {
    const pattern = `%${search.trim()}%`;
    conditions.push('(reporter.username LIKE ? OR reported.username LIKE ?)');
    params.push(pattern, pattern);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  try {
    const [[countRows], [rows]] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS total
         FROM Report r
         JOIN User reporter ON reporter.id = r.reporter_id
         JOIN User reported ON reported.id = r.reported_id
         ${whereClause}`,
        params
      ),
      db.query(
        `SELECT
           r.id, r.status, r.reason, r.description, r.admin_comment, r.date, r.review_date,
           reporter.id AS reporter_id, reporter.username AS reporter_username,
           reported.id AS reported_id, reported.username AS reported_username,
           reviser.id AS reviser_id, reviser.username AS reviser_username
         FROM Report r
         JOIN User reporter ON reporter.id = r.reporter_id
         JOIN User reported ON reported.id = r.reported_id
         LEFT JOIN User reviser ON reviser.id = r.reviser_id
         ${whereClause}
         ORDER BY r.date DESC, r.id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      )
    ]);

    const reports = rows.map((row) => ({
      id: row.id,
      status: row.status,
      reason: row.reason,
      description: row.description,
      admin_comment: row.admin_comment,
      date: row.date,
      review_date: row.review_date,
      reporter: { id: row.reporter_id, username: row.reporter_username },
      reported: { id: row.reported_id, username: row.reported_username },
      reviser: row.reviser_id ? { id: row.reviser_id, username: row.reviser_username } : null
    }));

    return successResponse(res, 200, 'Reportes obtenidos correctamente', {
      reports,
      pagination: { page, limit, total: Number(countRows[0].total) }
    });
  } catch (error) {
    console.error('Error al listar reportes:', error);
    return errorResponse(res, 500, 'Error al obtener reportes');
  }
};

const getReportDetail = async (req, res) => {
  if (!(await requireAdministrator(req, res))) return;
  const reportId = parsePositiveInt(req.params.id);
  if (!reportId) return errorResponse(res, 422, 'ID de reporte inválido');

  try {
    const [rows] = await db.query(
      `SELECT
         r.id, r.status, r.reason, r.description, r.admin_comment, r.date, r.review_date,
         reporter.id AS reporter_id, reporter.username AS reporter_username,
         reported.id AS reported_id, reported.username AS reported_username,
         reviser.id AS reviser_id, reviser.username AS reviser_username
       FROM Report r
       JOIN User reporter ON reporter.id = r.reporter_id
       JOIN User reported ON reported.id = r.reported_id
       LEFT JOIN User reviser ON reviser.id = r.reviser_id
       WHERE r.id = ?`,
      [reportId]
    );
    if (rows.length === 0) return errorResponse(res, 404, 'Reporte no encontrado');

    const row = rows[0];
    return successResponse(res, 200, 'Detalle de reporte obtenido correctamente', {
      report: {
        id: row.id,
        status: row.status,
        reason: row.reason,
        description: row.description,
        admin_comment: row.admin_comment,
        date: row.date,
        review_date: row.review_date,
        reporter: { id: row.reporter_id, username: row.reporter_username },
        reported: { id: row.reported_id, username: row.reported_username },
        reviser: row.reviser_id ? { id: row.reviser_id, username: row.reviser_username } : null
      }
    });
  } catch (error) {
    console.error('Error al obtener detalle de reporte:', error);
    return errorResponse(res, 500, 'Error al obtener detalle de reporte');
  }
};

const updateUserPenaltyDate = async (connection, user, penaltyDate) => {
  const defaultPenaltyDate = PENALTY_DATE.toISOString().slice(0, 10);
  const penaltyDateValue = new Date(`${penaltyDate ?? defaultPenaltyDate}T00:00:00`);
  user.penalty_date = penaltyDateValue;
  const oldDvh = user.dvh;
  delete user.dvh;
  const newDvh = computeDVHFromObject(user);

  await connection.query(
    'UPDATE User SET penalty_date = ?, dvh = ? WHERE id = ?',
    [penaltyDateValue, newDvh, user.id]
  );
  return { oldDvh, newDvh };
};

const resolveReport = async (req, res) => {
  if (!(await requireAdministrator(req, res))) return;

  const reportId = parsePositiveInt(req.params.id);
  const { action, admin_comment: rawComment, sanction } = req.body ?? {};
  if (!reportId) return errorResponse(res, 422, 'ID de reporte inválido');
  if (!['reject', 'sanction'].includes(action)) {
    return errorResponse(res, 422, 'La acción debe ser reject o sanction');
  }

  const adminComment = normalizeComment(rawComment);
  if (!adminComment) {
    return errorResponse(res, 422, 'El comentario debe tener entre 10 y 1000 caracteres');
  }
  if (action === 'reject' && sanction !== undefined) {
    return errorResponse(res, 422, 'No se puede incluir una sanción al rechazar un reporte');
  }

  const sanctionDetails = action === 'sanction' ? getSanctionExpiry(sanction) : null;
  if (sanctionDetails?.error) return errorResponse(res, 422, sanctionDetails.error);

  let connection;
  let transactionStarted = false;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [reportRows] = await connection.query(
      'SELECT id, reported_id, status FROM Report WHERE id = ? FOR UPDATE',
      [reportId]
    );
    if (reportRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return errorResponse(res, 404, 'Reporte no encontrado');
    }
    const report = reportRows[0];
    if (report.status !== 'PENDING') {
      await connection.rollback();
      transactionStarted = false;
      return errorResponse(res, 409, 'El reporte ya fue revisado');
    }

    if (action === 'reject') {
      const [result] = await connection.query(
        `UPDATE Report
         SET status = 'REJECTED', reviser_id = ?, admin_comment = ?, review_date = UTC_TIMESTAMP()
         WHERE id = ? AND status = 'PENDING'`,
        [req.user.user_id, adminComment, reportId]
      );
      if (result.affectedRows !== 1) throw new Error('El reporte dejó de estar pendiente durante la revisión.');
      await connection.commit();
      transactionStarted = false;
      req.actions_data = {
        [LOG_ACTIONS.REPORT_RESOLVE]: {
          entity: 'Report',
          record_id: reportId,
          action: 'reject'
        }
      };
      return successResponse(res, 200, 'Reporte rechazado correctamente', { reportId, status: 'REJECTED' });
    }

    const [userRows] = await connection.query(
      'SELECT * FROM User WHERE id = ? FOR UPDATE',
      [report.reported_id]
    );
    if (userRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return errorResponse(res, 404, 'Usuario reportado no encontrado');
    }
    const user = userRows[0];
    const [[role]] = await connection.query(
      'SELECT role FROM Role WHERE id = ?',
      [user.role_id]
    );
    if (role?.role === ADMINISTRATOR_ROLE) {
      await connection.rollback();
      transactionStarted = false;
      return errorResponse(res, 403, 'No se puede sancionar a un administrador');
    }

    const activeSanction = await getActiveSanction(connection, user.id);
    if (activeSanction) {
      await connection.rollback();
      transactionStarted = false;
      return errorResponse(res, 409, 'El usuario ya tiene una sanción activa');
    }

    const { oldDvh, newDvh } = await updateUserPenaltyDate(
      connection,
      user,
      sanctionDetails.penaltyDate
    );
    await connection.query(
      `INSERT INTO UserSanction
         (report_id, user_id, admin_id, is_permanent, starts_at, expires_at, admin_comment)
       VALUES (?, ?, ?, ?, UTC_TIMESTAMP(), ?, ?)`,
      [
        reportId,
        user.id,
        req.user.user_id,
        sanctionDetails.isPermanent ? 1 : 0,
        sanctionDetails.expiresAt,
        adminComment
      ]
    );
    const [reportUpdate] = await connection.query(
      `UPDATE Report
       SET status = 'RESOLVED', reviser_id = ?, admin_comment = ?, review_date = UTC_TIMESTAMP()
       WHERE id = ? AND status = 'PENDING'`,
      [req.user.user_id, adminComment, reportId]
    );
    if (reportUpdate.affectedRows !== 1) {
      throw new Error('El reporte dejó de estar pendiente durante la sanción.');
    }

    req.actions_data = {
      [LOG_ACTIONS.USER_BAN]: {
        entity: 'User',
        record_id: user.id,
        action: 'sanction',
        old_dvh: oldDvh,
        new_dvh: newDvh
      },
      [LOG_ACTIONS.REPORT_RESOLVE]: {
        entity: 'Report',
        record_id: reportId,
        action: 'resolve'
      }
    };

    await connection.commit();
    transactionStarted = false;
    try {
      const io = getIo();
      if (io) {
        const userRoom = `user:${user.id}`;
        const expiresAt = sanctionDetails.expiresAt
          ? `${sanctionDetails.expiresAt.replace(' ', 'T')}.000Z`
          : null;
        const daysRemaining = expiresAt
          ? Math.max(1, Math.ceil((Date.parse(expiresAt) - Date.now()) / 86400000))
          : null;
        io.to(userRoom).emit('account:suspended', {
          permanent: sanctionDetails.isPermanent,
          expiresAt,
          daysRemaining,
          reason: adminComment,
          message: sanctionDetails.isPermanent
            ? 'Tu cuenta tiene una suspensión permanente.'
            : 'Tu cuenta está suspendida temporalmente.'
        });
        io.in(userRoom).disconnectSockets(true);
      }
    } catch (socketError) {
      console.error('No se pudieron desconectar los sockets del usuario sancionado:', socketError);
    }
    return successResponse(res, 200, 'Sanción aplicada correctamente', {
      reportId,
      status: 'RESOLVED',
      permanent: sanctionDetails.isPermanent,
      expiresAt: sanctionDetails.expiresAt
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error al revertir la revisión del reporte:', rollbackError);
      }
    }
    console.error('Error al resolver reporte:', error);
    return errorResponse(res, 500, 'Error al resolver reporte');
  } finally {
    connection?.release();
  }
};

const revokeSanction = async (req, res) => {
  if (!(await requireAdministrator(req, res))) return;
  const userId = parsePositiveInt(req.params.id);
  if (!userId) return errorResponse(res, 422, 'ID de usuario inválido');

  let connection;
  let transactionStarted = false;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [users] = await connection.query('SELECT * FROM User WHERE id = ? FOR UPDATE', [userId]);
    if (users.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return errorResponse(res, 404, 'Usuario no encontrado');
    }
    const sanction = await getActiveSanction(connection, userId);
    if (!sanction) {
      await connection.rollback();
      transactionStarted = false;
      return errorResponse(res, 404, 'No hay una sanción activa para revocar');
    }

    const [result] = await connection.query(
      `UPDATE UserSanction
       SET revoked_at = UTC_TIMESTAMP(), revoked_by = ?
       WHERE id = ? AND revoked_at IS NULL`,
      [req.user.user_id, sanction.id]
    );
    if (result.affectedRows !== 1) {
      await connection.rollback();
      transactionStarted = false;
      return errorResponse(res, 409, 'La sanción ya fue revocada');
    }

    const { oldDvh, newDvh } = await updateUserPenaltyDate(connection, users[0], null);
    await connection.commit();
    transactionStarted = false;
    req.actions_data = {
      [LOG_ACTIONS.SANCTION_REVOKE]: {
        entity: 'User',
        record_id: userId,
        action: 'revoke',
        old_dvh: oldDvh,
        new_dvh: newDvh
      }
    };
    return successResponse(res, 200, 'Sanción revocada correctamente', { userId });
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error al revertir la revocación de sanción:', rollbackError);
      }
    }
    console.error('Error al revocar sanción:', error);
    return errorResponse(res, 500, 'Error al revocar sanción');
  } finally {
    connection?.release();
  }
};

module.exports = {
  getReports,
  getReportDetail,
  resolveReport,
  revokeSanction
};

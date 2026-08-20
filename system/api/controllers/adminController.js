const { ROLES_PERMISSIONS, ADMINISTRATOR_ROLE, REPORT_STATUSES, REPORT_REASONS, LOG_ACTIONS } = require('../constants');
const { computeDVHFromObject } = require('../utils/dvhHelpers');
const db = require('../config/db');

const isValidIsoDate = (value) => {
    if (typeof value !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const errorResponse = (res, statusCode, message) =>
    res.status(statusCode).json({ status: 'error', message });

const successResponse = (res, statusCode, message, data) =>
    res.status(statusCode).json({ status: 'success', message, ...(data ? { data } : {}) });

const sanitizeText = (value, maxLength) => {
    if (typeof value !== 'string') return null;
    const sanitized = value
        .replace(/[\u0000-\u001F\u007F]/g, '')
        .replace(/[<>]/g, '')
        .trim();
    return sanitized.length <= maxLength ? sanitized : null;
};

const requireAdministrator = async (req, res) => {
    let rows;
    try {
        [rows] = await db.query(
            `SELECT ro.role
             FROM User u
             JOIN Role ro ON ro.id = u.role_id
             WHERE u.id = ? AND u.eliminated = 0;`,
            [req.user?.user_id]
        );
    } catch (error) {
        console.error('Error verificando permisos de administrador:', error);
        errorResponse(res, 500, 'No se pudieron verificar los permisos');
        return false;
    }

    if (rows.length === 0) {
        errorResponse(res, 401, 'Usuario no autenticado');
        return false;
    }

    if (rows[0].role !== ADMINISTRATOR_ROLE) {
        errorResponse(res, 403, 'Se requiere permiso de administrador');
        return false;
    }

    return true;
};

const parseRequiredPositiveInt = (value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const deleteUser = async (req, res) => {
    const userId = req.params.id;
  
    req.actions_data = {};
    if (req.body.password) req.body.password = "[REDACTED]";

    let [userPayload] = await db.query(
        'SELECT * FROM User WHERE id = ?',
        [userId]
    );

    if (userPayload.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
    }

    // Guardar dvh viejo y actualizar dvh
    userPayload = userPayload[0];
    const oldDvh = userPayload.dvh;
    userPayload.eliminated = 1;
    delete userPayload.dvh;
    const newDvh = computeDVHFromObject(userPayload);
    userPayload.dvh = newDvh;

    req.actions_data["user-delete-user"] = {
        entity: "User",
        record_id: userId,
        action: "update",
        old_dvh: oldDvh,
        new_dvh: newDvh
    };

    try {
        const [result] = await db.query(
            'UPDATE User SET eliminated = ?, dvh = ? WHERE id = ?;',
            [1, newDvh, userId]
        );
      
        if (result.affectedRows === 0) { return res.status(404).json({ error: 'Usuario no encontrado' }); }

        res.json({ message: 'Usuario eliminado exitosamente' });
    } 
    
    catch (error) { res.status(500).json({ error: 'Error al eliminar usuario' }); }
};
  
const changeRole = async (req, res) => {
    const { rol } = req.body;
    const userId = req.params.id;

    req.actions_data = {};
    if (req.body.password) req.body.password = "[REDACTED]";

    try {

        // validar rol permitido
        if (!Number.isInteger(rol) || !(0 < rol && rol <= Object.keys(ROLES_PERMISSIONS).length)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        let [userPayload] = await db.query(
            'SELECT * FROM User WHERE id = ?',
            [userId]
        );

        // validar usuario existente
        if (userPayload.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        userPayload = userPayload[0];

        // impedir modificar admins
        if (
            userPayload.role_id ===
            Object.keys(ROLES_PERMISSIONS).indexOf(ADMINISTRATOR_ROLE) + 1
        ) {
            return res.status(403).json({
                error: 'No se le puede cambiar el rol a un administrador'
            });
        }

        const oldDvh = userPayload.dvh;

        // Modificar payload como quedará en BD
        userPayload.role_id = rol;

        // Recalcular DVH
        delete userPayload.dvh;

        const newDvh = computeDVHFromObject(userPayload);

        userPayload.dvh = newDvh;

        req.actions_data["user-update-role"] = {
            entity: "User",
            record_id: userId,
            action: "update",
            old_dvh: oldDvh,
            new_dvh: newDvh
        };

        await db.query(
            'UPDATE User SET role_id = ?, dvh = ? WHERE id = ?',
            [rol, newDvh, userId]
        );

        return res.json({
            message: 'Se cambió el rol del usuario correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            error: 'Error al cambiar el rol al usuario'
        });
    }
};

const getReports = async (req, res) => {
    req.actions_data = {};
    if (!(await requireAdministrator(req, res))) return;

    const { status, reason, reported_id, from, to, page = '1', limit = '20' } = req.query;
    const where = [];
    const params = [];

    const pageNumber = parseRequiredPositiveInt(page);
    const limitNumber = parseRequiredPositiveInt(limit);
    if (!pageNumber) {
        return errorResponse(res, 422, 'El parámetro page debe ser un entero positivo');
    }
    if (!limitNumber || limitNumber > 50) {
        return errorResponse(res, 422, 'El parámetro limit debe ser un entero entre 1 y 50');
    }

    if (status) {
        if (!REPORT_STATUSES.includes(status)) {
            return errorResponse(res, 422, 'Status inválido');
        }
        where.push('r.status = ?');
        params.push(status);
    }

    if (reason) {
        if (!REPORT_REASONS.includes(reason)) {
            return errorResponse(res, 422, 'Razón inválida');
        }
        where.push('r.reason = ?');
        params.push(reason);
    }

    if (reported_id !== undefined && reported_id !== '') {
        const reportedId = parseRequiredPositiveInt(reported_id);
        if (!reportedId) {
            return errorResponse(res, 422, 'reported_id inválido');
        }
        where.push('r.reported_id = ?');
        params.push(reportedId);
    }

    if (from !== undefined && from !== '') {
        if (!isValidIsoDate(from)) {
            return errorResponse(res, 422, 'Fecha from inválida');
        }
        where.push('r.date >= ?');
        params.push(`${from} 00:00:00`);
    }

    if (to !== undefined && to !== '') {
        if (!isValidIsoDate(to)) {
            return errorResponse(res, 422, 'Fecha to inválida');
        }
        where.push('r.date <= ?');
        params.push(`${to} 23:59:59`);
    }

    if (from && to && new Date(from) > new Date(to)) {
        return errorResponse(res, 422, 'El rango de fechas es inválido');
    }

    try {
        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const offset = (pageNumber - 1) * limitNumber;
        const [rows] = await db.query(
            `SELECT
                COUNT(*) OVER() AS total_count,
                r.id,
                r.status,
                r.reason,
                r.description,
                r.admin_comment,
                r.date,
                r.review_date,
                reporter.id AS reporter_id,
                reporter.username AS reporter_username,
                reported.id AS reported_id,
                reported.username AS reported_username,
                reported.eliminated AS reported_eliminated,
                reviser.id AS reviser_id,
                reviser.username AS reviser_username
            FROM Report r
            JOIN User reporter ON reporter.id = r.reporter_id
            JOIN User reported ON reported.id = r.reported_id
            LEFT JOIN User reviser ON reviser.id = r.reviser_id
            ${whereClause}
            ORDER BY r.date DESC
            LIMIT ? OFFSET ?;`,
            [...params, limitNumber, offset]
        );

        const reports = rows.map(row => ({
            id: row.id,
            status: row.status,
            reason: row.reason,
            description: row.description,
            admin_comment: row.admin_comment,
            date: row.date,
            review_date: row.review_date,
            reporter: {
                id: row.reporter_id,
                username: row.reporter_username
            },
            reported: {
                id: row.reported_id,
                username: row.reported_username,
                eliminated: row.reported_eliminated
            },
            reviser: row.reviser_id
                ? {
                    id: row.reviser_id,
                    username: row.reviser_username
                }
                : null
        }));

        return successResponse(res, 200, 'Reportes obtenidos correctamente', {
            reports,
            pagination: { page: pageNumber, limit: limitNumber, total: Number(rows[0]?.total_count ?? 0) }
        });
    } catch (error) {
        console.error('Error al listar reportes:', error);
        return errorResponse(res, 500, 'Error al obtener reportes');
    }
};

const getReportDetail = async (req, res) => {
    req.actions_data = {};
    if (!(await requireAdministrator(req, res))) return;

    const reportId = parseRequiredPositiveInt(req.params.id);

    if (!reportId) {
        return errorResponse(res, 422, 'ID de reporte inválido');
    }

    try {
        const [rows] = await db.query(
            `SELECT
                r.id,
                r.status,
                r.reason,
                r.description,
                r.admin_comment,
                r.date,
                r.review_date,
                reporter.id AS reporter_id,
                reporter.username AS reporter_username,
                reported.id AS reported_id,
                reported.username AS reported_username,
                reported.picture AS reported_picture,
                reported.biography AS reported_biography,
                reported.eliminated AS reported_eliminated,
                reviser.id AS reviser_id,
                reviser.username AS reviser_username,
                history_report.id AS history_id,
                history_report.status AS history_status,
                history_report.reason AS history_reason,
                history_report.description AS history_description,
                history_report.admin_comment AS history_admin_comment,
                history_report.date AS history_date,
                history_report.review_date AS history_review_date,
                history_reporter.id AS history_reporter_id,
                history_reporter.username AS history_reporter_username
            FROM Report r
            JOIN User reporter ON reporter.id = r.reporter_id
            JOIN User reported ON reported.id = r.reported_id
            LEFT JOIN User reviser ON reviser.id = r.reviser_id
            LEFT JOIN Report history_report ON history_report.reported_id = r.reported_id
            LEFT JOIN User history_reporter ON history_reporter.id = history_report.reporter_id
            WHERE r.id = ?
            ORDER BY history_report.date DESC;`,
            [reportId]
        );

        if (rows.length === 0) {
            return errorResponse(res, 404, 'Reporte no encontrado');
        }

        const report = rows[0];
        const history = rows.filter(row => row.history_id).map(row => ({
            id: row.history_id,
            status: row.history_status,
            reason: row.history_reason,
            description: row.history_description,
            admin_comment: row.history_admin_comment,
            date: row.history_date,
            review_date: row.history_review_date,
            reporter: { id: row.history_reporter_id, username: row.history_reporter_username }
        }));

        return successResponse(res, 200, 'Detalle de reporte obtenido correctamente', { report: {
                id: report.id,
                status: report.status,
                reason: report.reason,
                description: report.description,
                admin_comment: report.admin_comment,
                date: report.date,
                review_date: report.review_date,
                reporter: {
                    id: report.reporter_id,
                    username: report.reporter_username
                },
                reported: {
                    id: report.reported_id,
                    username: report.reported_username,
                    picture: report.reported_picture,
                    biography: report.reported_biography,
                    eliminated: report.reported_eliminated
                },
                reviser: report.reviser_id
                    ? {
                        id: report.reviser_id,
                        username: report.reviser_username
                    }
                    : null
            },
            history,
            total_reports: history.length
        });
    } catch (error) {
        console.error('Error al obtener detalle de reporte:', error);
        return errorResponse(res, 500, 'Error al obtener detalle de reporte');
    }
};

const resolveReport = async (req, res) => {
    req.actions_data = {};
    if (!(await requireAdministrator(req, res))) return;

    const reportId = parseRequiredPositiveInt(req.params.id);
    const { status, admin_comment, ban_user } = req.body;

    if (!reportId) {
        return errorResponse(res, 422, 'ID de reporte inválido');
    }

    if (!status || !REPORT_STATUSES.includes(status)) {
        return errorResponse(res, 422, 'Status inválido');
    }

    if (ban_user !== undefined && typeof ban_user !== 'boolean') {
        return errorResponse(res, 422, 'ban_user debe ser un booleano');
    }

    if (ban_user === true && status !== 'ACCEPTED') {
        return errorResponse(res, 422, 'ban_user solo puede usarse con status ACCEPTED');
    }

    if (admin_comment !== undefined && typeof admin_comment !== 'string') {
        return errorResponse(res, 422, 'admin_comment debe ser un texto');
    }

    const normalizedComment = admin_comment === undefined
        ? null
        : sanitizeText(admin_comment, 1000);
    if (admin_comment !== undefined && normalizedComment === null) {
        return errorResponse(res, 422, 'admin_comment debe tener entre 0 y 1000 caracteres');
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT * FROM Report WHERE id = ? FOR UPDATE;', [reportId]);
        if (rows.length === 0) {
            await connection.rollback();
            return errorResponse(res, 404, 'Reporte no encontrado');
        }

        const report = rows[0];
        if (report.status !== 'PENDING') {
            await connection.rollback();
            return errorResponse(res, 409, 'No se puede modificar un reporte ya resuelto');
        }

        if (ban_user === true) {
            const [userRows] = await connection.query('SELECT * FROM User WHERE id = ? FOR UPDATE;', [report.reported_id]);
            if (userRows.length === 0) {
                await connection.rollback();
                return errorResponse(res, 404, 'Usuario reportado no encontrado');
            }

            const userPayload = userRows[0];
            const [roleRows] = await connection.query(
                `SELECT role FROM Role WHERE id = ? FOR SHARE;`,
                [userPayload.role_id]
            );
            if (roleRows[0]?.role === ADMINISTRATOR_ROLE) {
                await connection.rollback();
                return errorResponse(res, 403, 'No se puede banear a un administrador');
            }

            const oldDvh = userPayload.dvh;
            userPayload.eliminated = 1;
            delete userPayload.dvh;
            const newDvh = computeDVHFromObject(userPayload);

            req.actions_data[LOG_ACTIONS.USER_BAN] = {
                entity: 'User',
                record_id: userPayload.id,
                action: LOG_ACTIONS.USER_BAN,
                old_dvh: oldDvh,
                new_dvh: newDvh
            };

            await connection.query('UPDATE User SET eliminated = ?, dvh = ? WHERE id = ?;', [1, newDvh, userPayload.id]);
        }

        await connection.query(
            'UPDATE Report SET status = ?, reviser_id = ?, admin_comment = ?, review_date = NOW() WHERE id = ?;', 
            [status, req.user.user_id, normalizedComment, reportId]
        );

        req.actions_data[LOG_ACTIONS.REPORT_RESOLVE] = {
            entity: 'Report',
            record_id: reportId,
            action: LOG_ACTIONS.REPORT_RESOLVE
        };

        await connection.commit();

        return successResponse(res, 200, 'Reporte resuelto correctamente', {
            reportId,
            status,
            banned_user: ban_user === true
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al resolver reporte:', error);
        return errorResponse(res, 500, 'Error al resolver reporte');
    } finally {
        connection.release();
    }
};

module.exports = {
    deleteUser,
    changeRole,
    getReports,
    getReportDetail,
    resolveReport
};
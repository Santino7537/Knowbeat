const { ROLES_PERMISSIONS, ADMINISTRATOR_ROLE, REPORT_STATUSES, REPORT_REASONS, LOG_ACTIONS } = require('../constants');
const { computeDVHFromObject } = require('../utils/dvhHelpers');
const db = require('../config/db');

const parsePositiveInt = (value, defaultValue) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return defaultValue;
    return parsed;
};

const isValidIsoDate = (value) => {
    if (typeof value !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
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
    const { status, reason, reported_id, from, to, page = '1', limit = '20' } = req.query;
    const where = [];
    const params = [];

    const pageNumber = parsePositiveInt(page, 1);
    const limitNumber = parsePositiveInt(limit, 20);
    if (pageNumber <= 0) {
        return res.status(400).json({ error: 'El parámetro page debe ser un entero positivo' });
    }
    if (limitNumber <= 0 || limitNumber > 50) {
        return res.status(400).json({ error: 'El parámetro limit debe ser un entero entre 1 y 50' });
    }

    if (status) {
        if (!REPORT_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }
        where.push('r.status = ?');
        params.push(status);
    }

    if (reason) {
        if (!REPORT_REASONS.includes(reason)) {
            return res.status(400).json({ error: 'Razón inválida' });
        }
        where.push('r.reason = ?');
        params.push(reason);
    }

    if (reported_id !== undefined && reported_id !== '') {
        const reportedId = Number(reported_id);
        if (!Number.isInteger(reportedId) || reportedId <= 0) {
            return res.status(400).json({ error: 'reported_id inválido' });
        }
        where.push('r.reported_id = ?');
        params.push(reportedId);
    }

    if (from !== undefined && from !== '') {
        if (!isValidIsoDate(from)) {
            return res.status(400).json({ error: 'Fecha from inválida' });
        }
        where.push('r.date >= ?');
        params.push(`${from} 00:00:00`);
    }

    if (to !== undefined && to !== '') {
        if (!isValidIsoDate(to)) {
            return res.status(400).json({ error: 'Fecha to inválida' });
        }
        where.push('r.date <= ?');
        params.push(`${to} 23:59:59`);
    }

    if (from && to && new Date(from) > new Date(to)) {
        return res.status(400).json({ error: 'El rango de fechas es inválido' });
    }

    try {
        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const [countRows] = await db.query(
            `SELECT COUNT(*) AS total FROM Report r ${whereClause};`,
            params
        );
        const total = countRows[0]?.total ?? 0;

        const offset = (pageNumber - 1) * limitNumber;
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

        res.status(200).json({
            reports,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total
            }
        });
    } catch (error) {
        console.error('Error al listar reportes:', error);
        res.status(500).json({ error: 'Error al obtener reportes' });
    }
};

const getReportDetail = async (req, res) => {
    req.actions_data = {};
    const reportId = Number(req.params.id);

    if (!Number.isInteger(reportId) || reportId <= 0) {
        return res.status(400).json({ error: 'ID de reporte inválido' });
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
                reviser.username AS reviser_username
            FROM Report r
            JOIN User reporter ON reporter.id = r.reporter_id
            JOIN User reported ON reported.id = r.reported_id
            LEFT JOIN User reviser ON reviser.id = r.reviser_id
            WHERE r.id = ?;`,
            [reportId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        const report = rows[0];

        const [historyRows] = await db.query(
            `SELECT
                r.id,
                r.status,
                r.reason,
                r.description,
                r.admin_comment,
                r.date,
                r.review_date,
                reporter.id AS reporter_id,
                reporter.username AS reporter_username
            FROM Report r
            JOIN User reporter ON reporter.id = r.reporter_id
            WHERE r.reported_id = ?
            ORDER BY r.date DESC;`,
            [report.reported_id]
        );

        const history = historyRows.map(row => ({
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
            }
        }));

        res.status(200).json({
            report: {
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
        res.status(500).json({ error: 'Error al obtener detalle de reporte' });
    }
};

const resolveReport = async (req, res) => {
    req.actions_data = {};
    const reportId = Number(req.params.id);
    const { status, admin_comment, ban_user } = req.body;

    if (!Number.isInteger(reportId) || reportId <= 0) {
        return res.status(400).json({ error: 'ID de reporte inválido' });
    }

    if (!status || !REPORT_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
    }

    if (ban_user !== undefined && typeof ban_user !== 'boolean') {
        return res.status(400).json({ error: 'ban_user debe ser un booleano' });
    }

    if (ban_user === true && status !== 'ACCEPTED') {
        return res.status(400).json({ error: 'ban_user solo puede usarse con status ACCEPTED' });
    }

    if (admin_comment !== undefined && typeof admin_comment !== 'string') {
        return res.status(400).json({ error: 'admin_comment debe ser un texto' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT * FROM Report WHERE id = ? FOR UPDATE;', [reportId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        const report = rows[0];
        if (report.status !== 'PENDING') {
            await connection.rollback();
            return res.status(400).json({ error: 'No se puede modificar un reporte ya resuelto' });
        }

        if (ban_user === true) {
            const [userRows] = await connection.query('SELECT * FROM User WHERE id = ? FOR UPDATE;', [report.reported_id]);
            if (userRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Usuario reportado no encontrado' });
            }

            const userPayload = userRows[0];
            const adminRoleId = Object.keys(ROLES_PERMISSIONS).indexOf(ADMINISTRATOR_ROLE) + 1;
            if (userPayload.role_id === adminRoleId) {
                await connection.rollback();
                return res.status(403).json({ error: 'No se puede banear a un administrador' });
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
            [status, req.user.user_id, admin_comment || null, reportId]
        );

        req.actions_data[LOG_ACTIONS.REPORT_RESOLVE] = {
            entity: 'Report',
            record_id: reportId,
            action: LOG_ACTIONS.REPORT_RESOLVE
        };

        await connection.commit();

        res.status(200).json({
            message: 'Reporte resuelto correctamente',
            reportId,
            status,
            banned_user: ban_user === true
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al resolver reporte:', error);
        res.status(500).json({ error: 'Error al resolver reporte' });
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
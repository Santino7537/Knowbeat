const { ROLE_PERMISSIONS } = require('../constants');
const db = require('../config/db');

const isAuth = async (req, res, next) => {
    const roleId = req.user.role_id;
    const role = Object.keys(ROLE_PERMISSIONS)[roleId - 1];

    const paramCount = Object.keys(req.params).length; // Cuántos params dinámicos hay
    const parts = req.path.split('/').filter(Boolean); // Divide por "/" y quita vacíos

    // Recorta las últimas X partes
    const basePath = parts.slice(0, parts.length - paramCount).join('-');

    const hasPermission = ROLE_PERMISSIONS[role].includes(basePath);

    if (!hasPermission) { return res.status(403).json({ message: "No está autorizado" }); }

    next();
};

module.exports = isAuth;
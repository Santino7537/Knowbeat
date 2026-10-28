const { ROLES_PERMISSIONS } = require('../constants');

const getPermissionCandidates = (req) => {
    const routePath = req.route?.path || req.path;
    const segments = routePath
        .split('/')
        .filter(Boolean)
        .filter(segment => !segment.startsWith(':'));

    const candidates = [];
    for (let i = 0; i < segments.length; i += 1) {
        candidates.push(segments.slice(0, i + 1).join('-'));
    }
    candidates.push(segments.join('-'));
    return [...new Set(candidates)];
};

const isAuth = async (req, res, next) => {
    const roleId = req.user.role_id;
    const role = Object.keys(ROLES_PERMISSIONS)[roleId - 1];

    const permissionCandidates = getPermissionCandidates(req);
    const hasPermission = permissionCandidates.some(candidate =>
        ROLES_PERMISSIONS[role].includes(candidate)
    );

    if (!hasPermission) {
        return res.status(403).json({ message: 'No está autorizado' });
    }

    next();
};

module.exports = isAuth;
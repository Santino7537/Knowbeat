const db = require('./db');
const { ROLES_PERMISSIONS, PERMISSIONS } = require('../constants');

const createPermissions = async () => {
    const permissionIds = new Map();
    for (const permission of PERMISSIONS) {
        let [existingPermission] = await db.query('SELECT id FROM Permission WHERE permission = ?;', [permission]);
        if (existingPermission.length !== 0) {
            console.log(`El permiso '${permission}' ya existe.`);
        } else {
            await db.query('INSERT INTO Permission (permission) VALUES (?);', [permission]);
            console.log(`El permiso '${permission}' se creó.`);
            [existingPermission] = await db.query('SELECT id FROM Permission WHERE permission = ?;', [permission]);
        }
        permissionIds.set(permission, existingPermission[0].id);
    }

    for (const role in ROLES_PERMISSIONS) {
        const [roles] = await db.query('SELECT id FROM Role WHERE role = ?;', [role]);
        if (!roles.length) throw new Error(`No existe el rol '${role}'`);
        const roleId = roles[0].id;
        for (const permission of ROLES_PERMISSIONS[role]) {
            const permissionId = permissionIds.get(permission);
            const [existingPermissionRole] = await db.query('SELECT * FROM RolePermission WHERE role_id = ? AND permission_id = ?;',
                [roleId, permissionId]);

            if (existingPermissionRole.length !== 0) {
                console.log(`El permiso '${permission}' ya está relacionado con el rol '${role}'.`);
            } else {
                await db.query('INSERT INTO RolePermission (role_id, permission_id) VALUES (?, ?);',
                    [roleId, permissionId]);
                console.log(`Se creó la relación entre el permiso '${permission}' y el rol '${role}'.`);
            }
        }
    }
}

module.exports = createPermissions;

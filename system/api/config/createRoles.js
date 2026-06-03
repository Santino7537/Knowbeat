const db = require('db');
const { ROLES_PERMISSIONS } = require('../constants');

const createRoles = async () => {
    for (const role in ROLES_PERMISSIONS) {
        const [existingRole] = await db.query('SELECT id FROM Role WHERE role = ?;', [role]);
        if (existingRole.length !== 0) {
            console.log(`El rol '${role}' ya existe.`);
        } else {
            await db.query('INSERT INTO Role (role) VALUES (?);', [role]);
            console.log(`El rol '${role}' se creó.`);
        }
    }
}

module.exports = { createRoles };

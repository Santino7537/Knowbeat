const { ADMINISTRATOR_ROLE, ROLES_PERMISSIONS, PENALTY_DATE, CONFIG_JSON } = require('../constants');

const { computeDVHFromObject } = require('../utils/dvhHelpers');
const bcrypt = require('bcrypt')
const db = require('./db');

const createAdmin = async () => {
    const start = process.hrtime.bigint();

    const [existingUsername] = await db.query('SELECT id FROM User WHERE username = ?;', [process.env.ADMIN_USERNAME]);
    if (existingUsername.length !== 0) return console.log("El nombre del admin ya existe.");

    const [existingEmail] = await db.query('SELECT id FROM User WHERE email = ?;', [process.env.ADMIN_EMAIL]);
    if (existingEmail.length !== 0) return console.log("El email del admin ya existe.");

    const adminRoleId = Object.keys(ROLES_PERMISSIONS).indexOf(ADMINISTRATOR_ROLE) + 1;

    const password = process.env.ADMIN_PASSWORD;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {

        const userPayload = {
            role_id: adminRoleId,
            username: process.env.ADMIN_USERNAME,
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            picture: `default_profile.webp`,
            streak: 0,
            score: 0,
            configuration: CONFIG_JSON,
            penalty_date: PENALTY_DATE,
            eliminated: 0
        }

        userPayload.dvh = computeDVHFromObject(userPayload);

        const admin = await db.query('INSERT INTO User (role_id, username, email, password, picture, streak, score, configuration, penalty_date, eliminated, dvh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
            Object.values(userPayload));
        console.log("Admin creado correctamente.");

        userPayload.password = "[REDACTED]"

        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

        const binnacle_data = {
            actions: {
                "register-user": {
                    "entity": "User",
                    "record_id": admin.insertId,
                    "action": "insert",
                    "old_dvh": null,
                    "new_dvh": userPayload.dvh
                }
            },
            endpoint_route: "createAdmin.js",
            ip_source: null,
            user_id: null,
            session_token: null,
            request_data: { "body": userPayload },
            response_data: {
                status_code: 201,
                response_time: durationMs
            },
            timestamp: new Date()
        };

        binnacle_data.dvh = computeDVHFromObject(binnacle_data);

        const values = Object.values(binnacle_data).map(value => {
            if (value instanceof Date) {
                return value;
            }
            
            if (value !== null && typeof value === 'object') {
            return JSON.stringify(value);
            }

            return value;
        });
        

        await db.query(
            "INSERT INTO Binnacle (actions, endpoint_route, ip_source, user_id, session_token, request_data, response_data, timestamp, dvh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
            values,
        );

        return admin;

    } catch (err) { console.error("Error creando admin:", err); }
}

module.exports = createAdmin;

const ADMINISTRATOR_ROLE = "Administrator";
const USER_ROLE = "User";

const ROLES_PERMISSIONS = {
    [ADMINISTRATOR_ROLE]: [],
    [USER_ROLE]: []
};

const PERMISSIONS = [...new Set(Object.values(ROLES_PERMISSIONS).flat())].sort()

const PENALTY_DATE = new Date("2000-01-01");

module.exports = {
    ADMINISTRATOR_ROLE,
    USER_ROLE,
    ROLES_PERMISSIONS,
    PERMISSIONS,
    PENALTY_DATE
};
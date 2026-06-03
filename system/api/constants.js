const ADMINISTRATOR_ROLE = "Administrator";
const USER_ROLE = "User";

const USER_PERMISSIONS = ['user-get-users', 'user-update-config', 'course-get-courses', 'user-get-progress', 'user-register-course', 'user-update-profile'];
const ROLES_PERMISSIONS = {
    [USER_ROLE]: USER_PERMISSIONS,
    [ADMINISTRATOR_ROLE]: [...USER_PERMISSIONS, 'user-update-role', 'user-delete-user']
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

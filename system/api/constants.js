const ADMINISTRATOR_ROLE = "Administrator";
const MODERATOR_ROLE = "Moderator";
const USER_ROLE = "User";

const USER_PERMISSIONS = ['user-get-users', 'user-get-config', 'user-update-config', 'course-get-courses', 'user-get-progress', 'user-register-course', 'user-update-profile'];
const ROLES_PERMISSIONS = {
    [USER_ROLE]: USER_PERMISSIONS,
    [MODERATOR_ROLE]: [...USER_PERMISSIONS],
    [ADMINISTRATOR_ROLE]: [...USER_PERMISSIONS, 'user-update-role', 'user-delete-user']
};
const PERMISSIONS = [...new Set(Object.values(ROLES_PERMISSIONS).flat())].sort()


const PENALTY_DATE = new Date("2000-01-01");


const VALID_FILES_FORMATS = {
    'images': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGE_PIXELS = 16_000_000;
const MIN_IMAGE_DIMENSIONS = 128; // Píxeles mínimos de ancho y alto
const MAX_IMAGE_DIMENSIONS = 4096; // Píxeles máximos de ancho y alto

const FILES_CONSTANTS = {
    'images': {
        MAX_IMAGE_SIZE,
        MAX_IMAGE_PIXELS,
        MIN_IMAGE_DIMENSIONS,
        MAX_IMAGE_DIMENSIONS
    }
}


module.exports = {
    ADMINISTRATOR_ROLE,
    USER_ROLE,
    ROLES_PERMISSIONS,
    PERMISSIONS,
    PENALTY_DATE,
    VALID_FILES_FORMATS,
    FILES_CONSTANTS
};

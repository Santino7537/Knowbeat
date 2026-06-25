const ADMINISTRATOR_ROLE = "Administrator";
const MODERATOR_ROLE = "Moderator";
const USER_ROLE = "User";

const USER_PERMISSIONS = ['user-get-user', 'user-get-users', 'user-get-config', 'user-update-config', 'user-update-profile', 'user-create-folder', 'user-update-folder', 'course-get-courses', 'user-get-progress', 'user-register-course', 'user-get-stats', 'user-update-goal'];
const ROLES_PERMISSIONS = {
    [USER_ROLE]: USER_PERMISSIONS,
    [MODERATOR_ROLE]: [...USER_PERMISSIONS],
    [ADMINISTRATOR_ROLE]: [...USER_PERMISSIONS, 'user-update-role', 'user-delete-user']
};
const PERMISSIONS = [...new Set(Object.values(ROLES_PERMISSIONS).flat())].sort()

const CONFIG_JSON = JSON.stringify({
    privacy: {
      private_account: false,
      progress_visibility: "everyone",
      restricted_messaging: false,
      show_activity: true
    },
    preferences: {
      notation: "american",
      microphone_exercises: true,
      listening_exercises: true,
      notifications: {
        streak_reminders: true,
        emails: true,
        mentions: true,
        likes: true,
        community_announcements: true
      }
    },
    appearance: {
      language: "es-AR",
      dark_mode: true
    }
});

const ALLOWED_CONFIGS = {

    // PRIVACY
    'privacy.private_account': 'boolean',
    'privacy.progress_visibility': 'string',
    'privacy.restricted_messaging': 'boolean',
    'privacy.show_activity': 'boolean',

    // PREFERENCES
    'preferences.notation': 'string',
    'preferences.microphone_exercises': 'boolean',
    'preferences.listening_exercises': 'boolean',

    // NOTIFICATIONS
    'preferences.notifications.streak_reminders': 'boolean',
    'preferences.notifications.emails': 'boolean',
    'preferences.notifications.mentions': 'boolean',
    'preferences.notifications.likes': 'boolean',
    'preferences.notifications.community_announcements': 'boolean',

    // APPEARANCE
    'appearance.language': 'string',
    'appearance.dark_mode': 'boolean'

};

const PENALTY_DATE = new Date("2000-01-01");

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

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
    MODERATOR_ROLE,
    USER_ROLE,
    ROLES_PERMISSIONS,
    PERMISSIONS,
    PENALTY_DATE,
    MAX_FILE_SIZE,
    VALID_FILES_FORMATS,
    FILES_CONSTANTS,
    CONFIG_JSON,
    ALLOWED_CONFIGS
};

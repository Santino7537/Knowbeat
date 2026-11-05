import { useState } from "react";
import axios from "axios";

import styles from "./CSS/Settings.module.css";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx"; // <-- 1. Importar el hook de idioma
import { getErrorMessage } from "../api/client";

// Etiquetas legibles para las claves de notificaciones que vienen del backend
const notificationLabels = {
  streak_reminders: { title: "Recordatorios de racha", description: "Te avisamos para que no pierdas tu racha diaria" },
  emails: { title: "Correos electrónicos", description: "Novedades y resúmenes en tu casilla" },
  mentions: { title: "Menciones", description: "Cuando alguien te menciona en la comunidad" },
  likes: { title: "Me gusta", description: "Cuando a alguien le gusta tu publicación" },
  community_announcements: { title: "Anuncios de la comunidad", description: "Avisos importantes del equipo de Knowbeat" }
};

const defaultSettings = {
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
};

const mergeSettings = (savedSettings) => ({
  ...defaultSettings,
  ...savedSettings,
  privacy: { ...defaultSettings.privacy, ...savedSettings?.privacy },
  preferences: {
    ...defaultSettings.preferences,
    ...savedSettings?.preferences,
    notifications: {
      ...defaultSettings.preferences.notifications,
      ...savedSettings?.preferences?.notifications
    }
  },
  appearance: { ...defaultSettings.appearance, ...savedSettings?.appearance }
});

const Settings = () => {

  /* ======================================================
     TOKEN Y USUARIO GUARDADO
  ====================================================== */

  const token = localStorage.getItem("token");

  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const savedSettings = storedUser?.configuration || storedUser;

  /* ======================================================
     TAB ACTIVA
  ====================================================== */

  const [activeTab, setActiveTab] = useState("privacidad");

  const { theme, setTheme } = useTheme();
  const { language, changeLanguage, t } = useLanguage(); // <-- 2. Consumir idioma y función de traducción
  const toast = useToast();

  const [settings, setSettings] = useState(() => {
    const merged = mergeSettings(savedSettings);
    return {
      ...merged,
      appearance: {
        ...merged.appearance,
        dark_mode: theme === "dark",
        language: language // Sincronizamos con el contexto actual
      }
    };
  });

  /* ======================================================
     MODO OSCURO / CLARO
  ====================================================== */

  const handleThemeChange = (nextTheme) => {
    if (nextTheme === theme) return;
    setTheme(nextTheme);
    handleToggle("appearance", "dark_mode", nextTheme === "dark");
  };

  /* ======================================================
     CAMBIO DE IDIOMA
  ====================================================== */

  const handleLanguageChange = (nextLang) => {
    if (nextLang === language) return;
    changeLanguage(nextLang);
    handleToggle("appearance", "language", nextLang);
  };

  const updateConfig = async (body) => {
    try {
      await axios.patch(
        "http://localhost:3000/user/update/config/",
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      toast.error(getErrorMessage(error, t("settings.errors.save_failed")));
    }
  };

  /* ======================================================
     LOCAL STORAGE
  ====================================================== */

  const updateLocalStorageUser = (updatedSettings) => {
    const updatedUser = storedUser?.configuration
      ? { ...storedUser, configuration: updatedSettings }
      : updatedSettings;

    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  /* ======================================================
     TOGGLES
  ====================================================== */

  const handleToggle = async (section, key, value) => {
    const updatedSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    };

    setSettings(updatedSettings);
    updateLocalStorageUser(updatedSettings);

    await updateConfig({
      [section]: {
        [key]: value
      }
    });
  };

  const handleNestedToggle = async (
    parent,
    section,
    key,
    value
  ) => {
    const updatedSettings = {
      ...settings,
      [parent]: {
        ...settings[parent],
        [section]: {
          ...settings[parent][section],
          [key]: value
        }
      }
    };

    setSettings(updatedSettings);
    updateLocalStorageUser(updatedSettings);

    await updateConfig({
      [parent]: {
        [section]: {
          [key]: value
        }
      }
    });
  };

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className={styles.settings_layout}>

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENIDO PRINCIPAL */}
      <div className={styles.settings_main}>

        <div className={styles.settings_page}>

          <div className={styles.settings_container}>

            {/* HEADER */}
            <div className={styles.settings_header}>
              <div>
                <h1>{t("settings.title")}</h1>
                <p>{t("settings.subtitle")}</p>
              </div>
            </div>

            {/* TABS */}
            <div className={styles.settings_tabs}>

              <button
                className={`${styles.tab} ${activeTab === "notificaciones" ? styles.active : ""}`}
                onClick={() => setActiveTab("notificaciones")}
              >
                {t("settings.tabs.notifications")}
              </button>

              <button
                className={`${styles.tab} ${activeTab === "privacidad" ? styles.active : ""}`}
                onClick={() => setActiveTab("privacidad")}
              >
                {t("settings.tabs.privacy")}
              </button>

              <button
                className={`${styles.tab} ${activeTab === "apariencia" ? styles.active : ""}`}
                onClick={() => setActiveTab("apariencia")}
              >
                {t("settings.tabs.appearance")}
              </button>

            </div>

            {/* PRIVACIDAD */}
            {activeTab === "privacidad" && (
              <div className={styles.settings_card}>
                <h2>{t("settings.privacy.title")}</h2>

                <div className={styles.setting_item}>
                  <div>
                    <h3>{t("settings.privacy.private_account")}</h3>
                    <p>{t("settings.privacy.private_desc")}</p>
                  </div>

                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.private_account}
                      onChange={(e) =>
                        handleToggle(
                          "privacy",
                          "private_account",
                          e.target.checked
                        )
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.setting_item}>
                  <div>
                    <h3>{t("settings.privacy.show_activity")}</h3>
                    <p>{t("settings.privacy.activity_desc")}</p>
                  </div>

                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.show_activity}
                      onChange={(e) =>
                        handleToggle(
                          "privacy",
                          "show_activity",
                          e.target.checked
                        )
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

              </div>
            )}

            {/* NOTIFICACIONES */}
            {activeTab === "notificaciones" && (
              <div className={styles.settings_card}>
                <h2>{t("settings.tabs.notifications")}</h2>

                {Object.entries(settings.preferences.notifications).map(
                  ([key, value]) => (
                    <div className={styles.setting_item} key={key}>
                      <div>
                        <h3>{notificationLabels[key]?.title || key.replaceAll("_", " ")}</h3>
                        {notificationLabels[key]?.description && (
                          <p>{notificationLabels[key].description}</p>
                        )}
                      </div>

                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            handleNestedToggle(
                              "preferences",
                              "notifications",
                              key,
                              e.target.checked
                            )
                          }
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  )
                )}
              </div>
            )}

            {/* APARIENCIA */}
            {activeTab === "apariencia" && (
              <div className={styles.settings_card}>
                <h2>{t("settings.tabs.appearance")}</h2>

                {/* SELECTOR DE IDIOMA */}
                <div className={styles.setting_item_column}>
                  <div>
                    <h3>{t("settings.appearance.language_title")}</h3>
                    <p>{t("settings.appearance.language_desc")}</p>
                  </div>

                  <div className={styles.theme_options} role="radiogroup" aria-label="Idioma">
                    {[
                      { value: "es-AR", label: "Español (Argentina)" },
                      { value: "en-US", label: "English (US)" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={language === option.value}
                        className={`${styles.theme_option} ${language === option.value ? styles.theme_option_active : ""}`}
                        onClick={() => handleLanguageChange(option.value)}
                      >
                        <span className={styles.theme_label}>
                          <span className={styles.theme_radio} aria-hidden="true"></span>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SELECTOR DE TEMA */}
                <div className={styles.setting_item_column}>
                  <div>
                    <h3>{t("settings.appearance.theme_title")}</h3>
                    <p>{t("settings.appearance.theme_desc")}</p>
                  </div>

                  <div className={styles.theme_options} role="radiogroup" aria-label="Tema">
                    {[
                      { value: "dark", label: t("settings.appearance.dark") },
                      { value: "light", label: t("settings.appearance.light") }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={theme === option.value}
                        className={`${styles.theme_option} ${theme === option.value ? styles.theme_option_active : ""}`}
                        onClick={() => handleThemeChange(option.value)}
                      >
                        <span className={`${styles.theme_preview} ${styles[`preview_${option.value}`]}`} aria-hidden="true">
                          <span className={styles.preview_sidebar}></span>
                          <span className={styles.preview_body}>
                            <span className={styles.preview_line}></span>
                            <span className={styles.preview_line_short}></span>
                            <span className={styles.preview_button}></span>
                          </span>
                        </span>
                        <span className={styles.theme_label}>
                          <span className={styles.theme_radio} aria-hidden="true"></span>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default Settings;
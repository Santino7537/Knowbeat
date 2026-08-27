import { useState, useEffect } from "react";
import axios from "axios";

import styles from "./CSS/Settings.module.css";
import Sidebar from "../components/Sidebar";

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

  const [activeTab, setActiveTab] =
    useState("privacidad");

  /* ======================================================
     CONFIGURACIÓN
  ====================================================== */

  // const defaultSettings = {
  //   privacidad: {
  //     cuenta_privada: false,
  //     visibilidad_progreso: "todos",
  //     mensajeria_restringida: false,
  //     mostrar_actividad: true
  //   },

  //   preferencia: {
  //     notacion: "americana",
  //     ejercicios_microfono: true,
  //     ejercicios_escucha: true,

  //     notificaciones: {
  //       recordatorio_racha: true,
  //       emails: true,
  //       menciones: true,
  //       likes: true,
  //       avisos_comunidad: true
  //     }
  //   },

  //   apariencia: {
  //     idioma: "es-AR",
  //     modo_oscuro: true
  //   }
  // };

  const [settings, setSettings] = useState(mergeSettings(savedSettings));

  /* ======================================================
     MODO OSCURO
  ====================================================== */

  useEffect(() => {
    if (settings.appearance.dark_mode) {
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
    }
    return () => document.body.classList.remove("light-mode");
  }, [settings.appearance.dark_mode]);


  const updateConfig = async (body) => {

    try {

      console.log("Enviando:", body);

      const response = await axios.patch(
        "http://localhost:3000/user/update/config/",
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(
        "Configuración actualizada:",
        response.data
      );

    } catch (error) {

      console.error(
        "Error actualizando configuración:"
      );

      console.error(
        error.response?.data || error
      );

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
     LOADING
  ====================================================== */

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div style={{ display: "flex" }}>

      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ marginLeft: "260px", width: "100%" }}>

        <div
          className={`${styles.settings_page} ${
            !settings.appearance.dark_mode ? styles.light_mode : ""
          }`}
        >

          <div className={styles.settings_container}>

            {/* HEADER */}
            <div className={styles.settings_header}>
              <div>
                <h1>Configuración</h1>
                <p>Administrá tu cuenta y preferencias</p>
              </div>
            </div>

            {/* TABS */}
            <div className={styles.settings_tabs}>

              <button
                  className={activeTab === "notificaciones" ? styles.active : ""}
                onClick={() => setActiveTab("notificaciones")}
              >
                Notificaciones
              </button>

              <button
                className={activeTab === "privacidad" ? styles.active : ""}
                onClick={() => setActiveTab("privacidad")}
              >
                Privacidad
              </button>

              <button
                className={activeTab === "apariencia" ? styles.active : ""}
                onClick={() => setActiveTab("apariencia")}
              >
                Apariencia
              </button>

            </div>

            {/* PRIVACIDAD */}
            {activeTab === "privacidad" && (
              <div className={styles.settings_card}>
                <h2>Privacidad</h2>

                <div className={styles.setting_item}>
                  <div>
                    <h3>Cuenta Privada</h3>
                    <p>Solo seguidores aprobados podrán ver tu perfil</p>
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
                    <h3>Mostrar Actividad</h3>
                    <p>Mostrar actividad reciente</p>
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
                <h2>Notificaciones</h2>

                {Object.entries(settings.preferences.notifications).map(
                  ([key, value]) => (
                    <div className={styles.setting_item} key={key}>
                      <div>
                        <h3>{key.replaceAll("_", " ")}</h3>
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
                <h2>Apariencia</h2>

                <div className={styles.setting_item}>
                  <div>
                    <h3>Modo Oscuro</h3>
                    <p>Cambiá entre tema claro y oscuro</p>
                  </div>

                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.appearance.dark_mode}
                      onChange={(e) =>
                        handleToggle(
                          "appearance",
                          "dark_mode",
                          e.target.checked
                        )
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
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
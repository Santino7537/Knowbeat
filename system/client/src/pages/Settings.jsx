import { useState, useEffect } from "react";
import axios from "axios";

import "./CSS/Settings.css";

const Settings = () => {

  // Token JWT guardado al iniciar sesión
  const token = localStorage.getItem("token");

  // Usuario actual logueado
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  // ID del usuario
  const userId = user?.id;

  // Tab activa
  const [activeTab, setActiveTab] =
    useState("privacidad");

  // Configuración inicial
  // Usa la del usuario si existe
  const [settings, setSettings] = useState(
    user?.configuration || {

      privacidad: {
        cuenta_privada: false,
        visibilidad_progreso: "todos",
        mensajeria_restringida: false,
        mostrar_actividad: true
      },

      preferencia: {
        notacion: "americana",
        ejercicios_microfono: true,
        ejercicios_escucha: true,

        notificaciones: {
          recordatorio_racha: true,
          emails: true,
          menciones: true,
          likes: true,
          avisos_comunidad: true
        }
      },

      apariencia: {
        idioma: "es-AR",
        modo_oscuro: true
      }

    }
  );

  // Cambia entre modo claro y oscuro
  useEffect(() => {

    if (settings.apariencia.modo_oscuro) {

      document.body.classList.remove(
        "light-mode"
      );

    } else {

      document.body.classList.add(
        "light-mode"
      );

    }

  }, [settings]);

  // Envía cambios al backend
  const updateConfig = async (body) => {

    try {

      await axios.patch(
        `http://localhost:3000/changeConfig/${userId}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(
        "Configuración actualizada"
      );

    } catch (error) {

      console.log(error);

    }
  };

  // Cambios simples
  const handleToggle = async (
    section,
    key,
    value
  ) => {

    const updatedSettings = {

      ...settings,

      [section]: {
        ...settings[section],

        [key]: value
      }
    };

    // Actualiza React
    setSettings(updatedSettings);

    // Actualiza localStorage
    const updatedUser = {
      ...user,
      configuration: updatedSettings
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    // Envía al backend
    await updateConfig({
      [section]: {
        [key]: value
      }
    });

  };

  // Cambios anidados
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

    // Actualiza React
    setSettings(updatedSettings);

    // Actualiza localStorage
    const updatedUser = {
      ...user,
      configuration: updatedSettings
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    // Envía al backend
    await updateConfig({
      [parent]: {
        [section]: {
          [key]: value
        }
      }
    });

  };

  return (

    <div className="settings-page">

      <div className="settings-container">

        <div className="settings-header">

          <h1>Configuración</h1>

          <p>
            Administrá tu cuenta y preferencias
          </p>

        </div>

        {/* Tabs */}
        <div className="settings-tabs">

          <button
            className={
              activeTab === "notificaciones"
                ? "active"
                : ""
            }

            onClick={() =>
              setActiveTab("notificaciones")
            }
          >
            Notificaciones
          </button>

          <button
            className={
              activeTab === "privacidad"
                ? "active"
                : ""
            }

            onClick={() =>
              setActiveTab("privacidad")
            }
          >
            Privacidad
          </button>

          <button
            className={
              activeTab === "apariencia"
                ? "active"
                : ""
            }

            onClick={() =>
              setActiveTab("apariencia")
            }
          >
            Apariencia
          </button>

        </div>

        {/* PRIVACIDAD */}
        {
          activeTab === "privacidad" && (

            <div className="settings-card">

              <h2>Privacidad</h2>

              <div className="setting-item">

                <div>

                  <h3>Cuenta Privada</h3>

                  <p>
                    Solo seguidores aprobados
                    podrán ver tu perfil
                  </p>

                </div>

                <label className="switch">

                  <input
                    type="checkbox"

                    checked={
                      settings.privacidad
                        .cuenta_privada
                    }

                    onChange={(e) =>
                      handleToggle(
                        "privacidad",
                        "cuenta_privada",
                        e.target.checked
                      )
                    }
                  />

                  <span className="slider"></span>

                </label>

              </div>

              <div className="setting-item">

                <div>

                  <h3>Mostrar Actividad</h3>

                  <p>
                    Mostrar actividad reciente
                  </p>

                </div>

                <label className="switch">

                  <input
                    type="checkbox"

                    checked={
                      settings.privacidad
                        .mostrar_actividad
                    }

                    onChange={(e) =>
                      handleToggle(
                        "privacidad",
                        "mostrar_actividad",
                        e.target.checked
                      )
                    }
                  />

                  <span className="slider"></span>

                </label>

              </div>

            </div>

          )
        }

        {/* NOTIFICACIONES */}
        {
          activeTab === "notificaciones" && (

            <div className="settings-card">

              <h2>Notificaciones</h2>

              {
                Object.entries(
                  settings.preferencia
                    .notificaciones
                ).map(([key, value]) => (

                  <div
                    className="setting-item"
                    key={key}
                  >

                    <div>

                      <h3>
                        {key.replaceAll("_", " ")}
                      </h3>

                    </div>

                    <label className="switch">

                      <input
                        type="checkbox"

                        checked={value}

                        onChange={(e) =>
                          handleNestedToggle(
                            "preferencia",
                            "notificaciones",
                            key,
                            e.target.checked
                          )
                        }
                      />

                      <span className="slider"></span>

                    </label>

                  </div>

                ))
              }

            </div>

          )
        }

        {/* APARIENCIA */}
        {
          activeTab === "apariencia" && (

            <div className="settings-card">

              <h2>Apariencia</h2>

              <div className="setting-item">

                <div>

                  <h3>Modo Oscuro</h3>

                  <p>
                    Cambiá entre tema claro y oscuro
                  </p>

                </div>

                <label className="switch">

                  <input
                    type="checkbox"

                    checked={
                      settings.apariencia
                        .modo_oscuro
                    }

                    onChange={(e) =>
                      handleToggle(
                        "apariencia",
                        "modo_oscuro",
                        e.target.checked
                      )
                    }
                  />

                  <span className="slider"></span>

                </label>

              </div>

            </div>

          )
        }

      </div>

    </div>

  );
};

export default Settings;    
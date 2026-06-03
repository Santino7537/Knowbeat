import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CSS/AdminView.css";

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("users");
  const [roleFilter, setRoleFilter] = useState("all");

  // MODAL ELIMINAR
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState(null);

  // REPORTES (PREPARADO PARA BACKEND)
  const [reports, setReports] = useState([]);

  // ANUNCIOS
  const [announcementTitle, setAnnouncementTitle] =
    useState("");

  const [announcementMessage, setAnnouncementMessage] =
    useState("");

  // USUARIO ACTUAL
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, []);

  // USERS
  const fetchUsers = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(
        "http://localhost:3000/user/get/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(res.data);
    } catch (err) {
      console.error(
        "Error cargando usuarios:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  // REPORTES
  // PREPARADO PARA BACKEND
  const fetchReports = async () => {
    try {
      /*
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:3000/reports",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReports(res.data);
      */

      // MOCK TEMPORAL
      setReports([
      ]);
    } catch (err) {
      console.error(
        "Error cargando reportes:",
        err
      );
    }
  };

  // ELIMINAR USUARIO
  const deleteUser = async (id, role) => {
    if (role === 2) {
      alert(
        "No podés eliminar otro administrador"
      );

      return;
    }

    const token = localStorage.getItem("token");

    try {
      await axios.patch(
        `http://localhost:3000/user/delete/user/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (err) {
      console.error(
        "Error eliminando usuario:",
        err
      );
    }
  };

  // CAMBIAR ROL
  const handleRoleChange = async (
    id,
    role
  ) => {
    const token = localStorage.getItem("token");

    try {
      await axios.patch(
        `http://localhost:3000/user/update/role/${id}`,
        {
          rol: Number(role),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (err) {
      console.error(
        "Error cambiando rol:",
        err
      );
    }
  };

  // CREAR ANUNCIO
  // PREPARADO PARA BACKEND
  const handleCreateAnnouncement =
    async () => {
      try {
        /*
        const token = localStorage.getItem("token");

        await axios.post(
          "http://localhost:3000/announcements",
          {
            title: announcementTitle,
            message: announcementMessage,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        */

        alert(
          "Sistema preparado para conexión backend"
        );

        setAnnouncementTitle("");
        setAnnouncementMessage("");
      } catch (err) {
        console.error(
          "Error creando anuncio:",
          err
        );
      }
    };

  // FILTRO
  const filteredUsers = users.filter((u) => {
    if (roleFilter === "all") return true;

    return u.role_id === Number(roleFilter);
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="admin-top">
        <div>
          <h1>Panel de Administración</h1>

          <p>
            Gestiona usuarios, permisos y
            moderación de KnowBeat
          </p>
        </div>

        <div className="admin-badge">
          ADMIN
        </div>
      </div>

      {/* TABS */}
      <div className="admin-tabs">
        <button
          className={
            activeTab === "users"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveTab("users")
          }
        >
          Usuarios
        </button>

        <button
          className={
            activeTab === "reports"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveTab("reports")
          }
        >
          Reportes
        </button>

        <button
          className={
            activeTab === "announcements"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveTab("announcements")
          }
        >
          Anuncios
        </button>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>Total usuarios</span>

          <h2>{users.length}</h2>
        </div>

        <div className="stat-card">
          <span>Administradores</span>

          <h2>
            {
              users.filter(
                (u) => u.role_id === 2
              ).length
            }
          </h2>
        </div>

        <div className="stat-card">
          <span>Moderadores</span>

          <h2>
            {
              users.filter(
                (u) => u.role_id === 3
              ).length
            }
          </h2>
        </div>

        <div className="stat-card">
          <span>Reportes</span>

          <h2>{reports.length}</h2>
        </div>
      </div>

      {/* USERS */}
      {activeTab === "users" && (
        <div className="users-container">
          <div className="section-title">
            <h2>Gestión de Usuarios</h2>

            <p>
              Administrá permisos, roles y
              usuarios del sistema
            </p>
          </div>

          {/* FILTRO */}
          <div className="filter-row">
            <select
              className="role-select"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
            >
              <option value="all">
                Todos
              </option>

              <option value="1">
                Usuarios
              </option>

              <option value="2">
                Administradores
              </option>

              <option value="3">
                Moderadores
              </option>
            </select>
          </div>

          {filteredUsers.map((u) => (
            <div
              className="user-card"
              key={u.id}
            >
              {/* LEFT */}
              <div className="user-left">
                <div className="avatar">
                  {u.username?.[0]?.toUpperCase()}
                </div>

                <div className="user-data">
                  <h3>{u.username}</h3>

                  <p>{u.email}</p>

                  <div className="role-row">
                    <span
                      className={
                        u.role_id === 2
                          ? "role admin"
                          : u.role_id === 3
                          ? "role mod"
                          : "role user"
                      }
                    >
                      {u.role_id === 2
                        ? "Administrador"
                        : u.role_id === 3
                        ? "Moderador"
                        : "Usuario"}
                    </span>

                    {currentUser?.id ===
                      u.id && (
                      <span className="you-badge">
                        Vos
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="user-actions">
                {/* CAMBIAR ROL */}
                {u.role_id !== 2 && (
                  <select
                    className="role-select"
                    value={u.role_id}
                    onChange={(e) =>
                      handleRoleChange(
                        u.id,
                        e.target.value
                      )
                    }
                  >
                    <option value={1}>
                      Usuario
                    </option>

                    <option value={3}>
                      Moderador
                    </option>

                    <option value={2}>
                      Administrador
                    </option>
                  </select>
                )}

                {/* ELIMINAR */}
                <button
                  className={
                    u.role_id === 2
                      ? "delete-btn disabled"
                      : "delete-btn"
                  }
                  disabled={u.role_id === 2}
                  onClick={() => {
                    setSelectedUser(u);
                    setShowDeleteModal(
                      true
                    );
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORTES */}
      {activeTab === "reports" && (
        <div className="users-container">
          <div className="section-title">
            <h2>Reportes</h2>

            <p>
              Sistema preparado para conexión
              backend
            </p>
          </div>

          {reports.map((report) => (
            <div
              className="report-card"
              key={report.id}
            >
              <div className="report-header">
                <h3>
                  {report.reportedUser}
                </h3>

                <span className="report-count">
                  {report.totalReports}
                  {" "}
                  reportes
                </span>
              </div>

              <p>{report.reason}</p>

              <span className="report-author">
                Reportado por:
                {" "}
                {report.createdBy}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ANUNCIOS */}
      {activeTab ===
        "announcements" && (
        <div className="users-container">
          <div className="section-title">
            <h2>Anuncios</h2>

            <p>
              Publicaciones para toda la
              comunidad
            </p>
          </div>

          <div className="announcement-form">
            <input
              type="text"
              placeholder="Título"
              value={announcementTitle}
              onChange={(e) =>
                setAnnouncementTitle(
                  e.target.value
                )
              }
              className="announcement-input"
            />

            <textarea
              placeholder="Mensaje..."
              value={
                announcementMessage
              }
              onChange={(e) =>
                setAnnouncementMessage(
                  e.target.value
                )
              }
              className="announcement-textarea"
            />

            <button
              className="publish-btn"
              onClick={
                handleCreateAnnouncement
              }
            >
              Publicar anuncio
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h2>Eliminar usuario</h2>

            <p>
              ¿Estás seguro que deseas
              eliminar a
              <strong>
                {" "}
                {
                  selectedUser?.username
                }
              </strong>
              ?
            </p>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(
                    false
                  );

                  setSelectedUser(null);
                }}
              >
                Cancelar
              </button>

              <button
                className="confirm-delete-btn"
                onClick={async () => {
                  await deleteUser(
                    selectedUser.id,
                    selectedUser.role_id
                  );

                  setShowDeleteModal(
                    false
                  );

                  setSelectedUser(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
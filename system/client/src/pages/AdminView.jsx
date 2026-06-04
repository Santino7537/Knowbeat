import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./CSS/AdminView.module.css";

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("users");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [reports, setReports] = useState([]);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");

  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(
        "http://localhost:3000/user/get/users",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(res.data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      /*
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:3000/reports",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setReports(res.data);
      */

      setReports([]);
    } catch (err) {
      console.error("Error cargando reportes:", err);
    }
  };

  const deleteUser = async (id, role) => {
    if (role === 2) {
      alert("No podés eliminar otro administrador");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      await axios.patch(
        `http://localhost:3000/user/delete/user/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchUsers();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
    }
  };

  const handleRoleChange = async (id, role) => {
    const token = localStorage.getItem("token");

    try {
      await axios.patch(
        `http://localhost:3000/user/update/role/${id}`,
        {
          rol: Number(role)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchUsers();
    } catch (err) {
      console.error("Error cambiando rol:", err);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      /*
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:3000/announcements",
        {
          title: announcementTitle,
          message: announcementMessage
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      */

      alert("Sistema preparado para conexión backend");

      setAnnouncementTitle("");
      setAnnouncementMessage("");
    } catch (err) {
      console.error("Error creando anuncio:", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter === "all") return true;

    return u.role_id === Number(roleFilter);
  });

  if (loading) {
    return (
      <div className={styles.admin_loading}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.admin_page}>
      <div className={styles.admin_top}>
        <div>
          <h1>Panel de Administración</h1>

          <p>
            Gestiona usuarios, permisos y moderación de KnowBeat
          </p>
        </div>

        <div className={styles.admin_badge}>
          ADMIN
        </div>
      </div>

      <div className={styles.admin_tabs}>
        <button
          className={
            activeTab === "users"
              ? `${styles.tab} ${styles.active}`
              : styles.tab
          }
          onClick={() => setActiveTab("users")}
        >
          Usuarios
        </button>

        <button
          className={
            activeTab === "reports"
              ? `${styles.tab} ${styles.active}`
              : styles.tab
          }
          onClick={() => setActiveTab("reports")}
        >
          Reportes
        </button>

        <button
          className={
            activeTab === "announcements"
              ? `${styles.tab} ${styles.active}`
              : styles.tab
          }
          onClick={() => setActiveTab("announcements")}
        >
          Anuncios
        </button>
      </div>

      <div className={styles.stats_grid}>
        <div className={styles.stat_card}>
          <span>Total usuarios</span>
          <h2>{users.length}</h2>
        </div>

        <div className={styles.stat_card}>
          <span>Administradores</span>
          <h2>
            {
              users.filter(
                (u) => u.role_id === 2
              ).length
            }
          </h2>
        </div>

        <div className={styles.stat_card}>
          <span>Moderadores</span>
          <h2>
            {
              users.filter(
                (u) => u.role_id === 3
              ).length
            }
          </h2>
        </div>

        <div className={styles.stat_card}>
          <span>Reportes</span>
          <h2>{reports.length}</h2>
        </div>
      </div>
      {activeTab === "users" && (
        <div className={styles.users_container}>
          <div className={styles.section_title}>
            <h2>Gestión de Usuarios</h2>

            <p>
              Administrá permisos, roles y usuarios del sistema
            </p>
          </div>

          <div className={styles.filter_row}>
            <select
              className={styles.role_select}
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
              className={styles.user_card}
              key={u.id}
            >
              <div className={styles.user_left}>
                <div className={styles.avatar}>
                  {u.username?.[0]?.toUpperCase()}
                </div>

                <div className={styles.user_data}>
                  <h3>{u.username}</h3>

                  <p>{u.email}</p>

                  <div className={styles.role_row}>
                    <span
                      className={
                        u.role_id === 2
                          ? `${styles.role} ${styles.admin}`
                          : u.role_id === 3
                          ? `${styles.role} ${styles.mod}`
                          : `${styles.role} ${styles.user}`
                      }
                    >
                      {u.role_id === 2
                        ? "Administrador"
                        : u.role_id === 3
                        ? "Moderador"
                        : "Usuario"}
                    </span>

                    {currentUser?.id === u.id && (
                      <span className={styles.you_badge}>
                        Vos
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.user_actions}>
                {u.role_id !== 2 && (
                  <select
                    className={styles.role_select}
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

                <button
                  className={
                    u.role_id === 2
                      ? `${styles.delete_btn} ${styles.disabled}`
                      : styles.delete_btn
                  }
                  disabled={u.role_id === 2}
                  onClick={() => {
                    setSelectedUser(u);
                    setShowDeleteModal(true);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "reports" && (
        <div className={styles.users_container}>
          <div className={styles.section_title}>
            <h2>Reportes</h2>

            <p>
              Sistema preparado para conexión backend
            </p>
          </div>

          {reports.map((report) => (
            <div
              className={styles.report_card}
              key={report.id}
            >
              <div className={styles.report_header}>
                <h3>
                  {report.reportedUser}
                </h3>

                <span className={styles.report_count}>
                  {report.totalReports} reportes
                </span>
              </div>

              <p>{report.reason}</p>

              <span className={styles.report_author}>
                Reportado por:{" "}
                {report.createdBy}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "announcements" && (
        <div className={styles.users_container}>
          <div className={styles.section_title}>
            <h2>Anuncios</h2>

            <p>
              Publicaciones para toda la comunidad
            </p>
          </div>

          <div className={styles.announcement_form}>
            <input
              type="text"
              placeholder="Título"
              value={announcementTitle}
              onChange={(e) =>
                setAnnouncementTitle(
                  e.target.value
                )
              }
              className={styles.announcement_input}
            />

            <textarea
              placeholder="Mensaje..."
              value={announcementMessage}
              onChange={(e) =>
                setAnnouncementMessage(
                  e.target.value
                )
              }
              className={
                styles.announcement_textarea
              }
            />

            <button
              className={styles.publish_btn}
              onClick={
                handleCreateAnnouncement
              }
            >
              Publicar anuncio
            </button>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className={styles.modal_overlay}>
          <div className={styles.delete_modal}>
            <h2>Eliminar usuario</h2>

            <p>
              ¿Estás seguro que deseas eliminar a
              <strong>
                {" "}
                {selectedUser?.username}
              </strong>
              ?
            </p>

            <div className={styles.modal_actions}>
              <button
                className={styles.cancel_btn}
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancelar
              </button>

              <button
                className={
                  styles.confirm_delete_btn
                }
                onClick={async () => {
                  await deleteUser(
                    selectedUser.id,
                    selectedUser.role_id
                  );

                  setShowDeleteModal(false);
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


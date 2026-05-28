import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CSS/AdminView.css";

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get("http://localhost:3000/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  //  ELIMINAR USUARIO (FUNCIONAL)
  const deleteUser = async (id, role) => {
    if (role === 2) {
      alert("No podés eliminar otro administrador");
      return;
    }

    const confirmDelete = window.confirm(
      "¿Estás seguro que deseas eliminar este usuario?"
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    try {
      await axios.patch(
        `http://localhost:3000/delUsers/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
    }
  };

  const changeRole = () => {
    alert("La conexión para cambiar roles todavía no está implementada");
  };

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
            Gestiona usuarios, permisos y moderación de KnowBeat
          </p>
        </div>

        <div className="admin-badge">
          ADMIN
        </div>
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
            {users.filter((u) => u.role_id === 2).length}
          </h2>
        </div>

        <div className="stat-card">
          <span>Usuarios </span>
          <h2>
            {users.filter((u) => u.role_id !== 2).length}
          </h2>
        </div>

        <div className="stat-card">
          <span>Sistema</span>
          <h2>Activo</h2>
        </div>
      </div>

      {/* USERS */}
      <div className="users-container">
        <div className="section-title">
          <h2>Gestión de Usuarios</h2>
          <p>
            Administrá permisos, roles y usuarios del sistema
          </p>
        </div>

        {users.map((u) => (
          <div className="user-card" key={u.id}>
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
                  onChange={async (e) => {
                    const token = localStorage.getItem("token");

                    try {
                      await axios.patch(
                        `http://localhost:3000/changeRole/${u.id}`,
                        {
                          rol: Number(e.target.value),
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
                  }}
                >
                  <option value={1}>Usuario</option>
                  <option value={3}>Moderador</option>
                  <option value={2}>Administrador</option>
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
                onClick={() =>
                  deleteUser(u.id, u.role_id)
                }
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
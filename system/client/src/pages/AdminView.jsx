import React, { useState, useEffect } from "react";
import axios from "axios";

import Sidebar from "../components/Sidebar";

import "./CSS/AdminView.css";

export default function AdminView() {

  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {

    const token = localStorage.getItem("token");

    try {

      const res = await axios.get(
        "http://localhost:3000/users",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsers(res.data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  };

  const deleteUser = async (id) => {

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
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchUsers();

    } catch (err) {

      console.error(err);

    }
  };

  const changeRole = () => {
    alert("Función próximamente");
  };

  if (loading) {
    return <p className="loading">Cargando...</p>;
  }

  return (
    <div className="admin-layout">

      <Sidebar tab={tab} setTab={setTab} />

      <main className="admin-content">

        <div className="top-section">
          <div>
            <h1>Panel de Administración</h1>
            <p>
              Gestiona usuarios, reportes y moderación
            </p>
          </div>
        </div>

        <div className="stats">

          <div className="card">
            <span>Total usuarios</span>
            <h2>{users.length}</h2>
          </div>

          <div className="card">
            <span>Admins</span>
            <h2>
              {
                users.filter(u => u.role_id === 2).length
              }
            </h2>
          </div>

          <div className="card">
            <span>Usuarios normales</span>
            <h2>
              {
                users.filter(u => u.role_id === 1).length
              }
            </h2>
          </div>

        </div>

        {
          tab === "users" && (

            <div className="users-grid">

              {
                users.map((u) => (

                  <div className="user-card" key={u.id}>

                    <div className="avatar">
                      {u.username?.[0]?.toUpperCase()}
                    </div>

                    <div className="user-info">

                      <h3>{u.username}</h3>

                      <p>{u.email}</p>

                      <span className="role">
                        {
                          u.role_id === 2
                            ? "Administrador"
                            : "Usuario"
                        }
                      </span>

                    </div>

                    <div className="actions">

                      <button
                        className="role-btn"
                        onClick={changeRole}
                      >
                        Cambiar Rol
                      </button>

                      {
                        u.role_id !== 2 && (
                          <button
                            className="delete-btn"
                            onClick={() => deleteUser(u.id)}
                          >
                            Eliminar
                          </button>
                        )
                      }

                    </div>

                  </div>

                ))
              }

            </div>

          )
        }

        {
          tab === "reports" && (
            <div className="coming-soon">
              <h2>🚨 Reportes</h2>
              <p>
                Esta sección estará disponible cuando el backend esté listo.
              </p>
            </div>
          )
        }

        {
          tab === "announcements" && (
            <div className="coming-soon">
              <h2>📢 Anuncios</h2>
              <p>
                Sistema de anuncios próximamente.
              </p>
            </div>
          )
        }

      </main>

    </div>
  );
}
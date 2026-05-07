import React, { useState, useEffect } from "react";
import axios from "axios";
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
      const res = await axios.get("http://localhost:3000/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.patch(
        `http://localhost:3000/delUsers/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
      });
      
      fetchUsers();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
    }
  };

  // funciones desactivadas (porque no existen endpoints todavía)
  const disabledAction = () => {
    alert("Esta función todavía no está disponible");
  };

  if (loading) return <p className="admin">Cargando...</p>;

  return (
    <div className="admin">
      <h1>Panel de Administración</h1>
      <p className="subtitle">
        Gestiona usuarios, reportes y anuncios
      </p>

      {/* STATS */}
      <div className="stats">
        <div className="card">
          <p>Total usuarios</p>
          <h2>{users.length}</h2>
        </div>
        <div className="card">
          <p>Reportes</p>
          <h2>—</h2>
        </div>
        <div className="card">
          <p>Penalizaciones</p>
          <h2>—</h2>
        </div>
        <div className="card">
          <p>Anuncios</p>
          <h2>—</h2>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        <button
          onClick={() => setTab("reports")}
          className={tab === "reports" ? "active" : ""}
        >
          Reportes
        </button>
        <button
          onClick={() => setTab("users")}
          className={tab === "users" ? "active" : ""}
        >
          Usuarios
        </button>
        <button
          onClick={() => setTab("announcements")}
          className={tab === "announcements" ? "active" : ""}
        >
          Anuncios
        </button>
      </div>

      {/* REPORTES (UI SOLAMENTE) */}
      {tab === "reports" && (
        <div className="section">
          <div className="report-card">
            <h3>Sección en desarrollo</h3>
            <p className="meta">
              Los reportes estarán disponibles cuando el backend esté listo
            </p>

            <div className="actions">
              <button onClick={disabledAction}>Ver</button>
              <button className="danger" onClick={disabledAction}>
                Penalizar
              </button>
              <button onClick={disabledAction}>
                Resolver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USERS (FUNCIONAL) */}
      {tab === "users" && (
        <div className="section">
          <div className="header">
            <h2>Gestión de Usuarios</h2>
          </div>

          {users.map((u) => (
            <div key={u.id} className="user-card">
              <div className="user-info">
                <div className="avatar">
                  {u.username?.[0]?.toUpperCase()}
                </div>

                <div>
                  <div className="user-name">
                    {u.username}
                    <span className="badge outline">
                      Rol: {u.role_id}
                    </span>
                  </div>

                  <p className="meta">{u.email}</p>
                </div>
              </div>

              <div className="actions">
                <button
                  className="danger"
                  onClick={() => deleteUser(u.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANUNCIOS (UI SOLAMENTE) */}
      {tab === "announcements" && (
        <div className="section">
          <h2>Crear Anuncio</h2>

          <input
            placeholder="Título..."
            className="input"
            disabled
          />

          <textarea
            placeholder="Mensaje..."
            className="input"
            disabled
          />

          <button
            className="primary"
            onClick={disabledAction}
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  );
}
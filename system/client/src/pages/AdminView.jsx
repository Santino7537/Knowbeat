import React, { useState } from "react";
import "./CSS/AdminView.css";

const reportsData = [
  {
    id: 1,
    reason: "Contenido inapropiado",
    reporter: "Ana López",
    reported: "Usuario123",
    description: "Publicó contenido no relacionado con música",
    date: "Hace 2 horas",
    status: "pending",
    type: "Usuario",
  },
  {
    id: 2,
    reason: "Spam",
    reporter: "Carlos Méndez",
    reported: "Publicación #542",
    description: "Promoción repetida",
    date: "Hace 5 horas",
    status: "pending",
    type: "Publicación",
  },
];

const usersData = [
  {
    id: 1,
    name: "Ana López",
    username: "@ana_piano",
    role: "Usuario",
    status: "active",
    joined: "Enero 2025",
  },
  {
    id: 2,
    name: "Carlos Méndez",
    username: "@carlos_guitar",
    role: "Moderador",
    status: "active",
    joined: "Diciembre 2024",
  },
  {
    id: 3,
    name: "Usuario123",
    username: "@user123",
    role: "Usuario",
    status: "penalized",
    joined: "Marzo 2025",
  },
];

export default function AdminView() {
  const [tab, setTab] = useState("reports");

  return (
    <div className="admin">
      <h1>Panel de Administración</h1>
      <p className="subtitle">
        Gestiona reportes, usuarios y moderación
      </p>

      {/* STATS */}
      <div className="stats">
        <div className="card">
          <p>Reportes Pendientes</p>
          <h2>12</h2>
        </div>
        <div className="card">
          <p>Usuarios Activos</p>
          <h2>1247</h2>
        </div>
        <div className="card">
          <p>Usuarios Penalizados</p>
          <h2>8</h2>
        </div>
        <div className="card">
          <p>Reportes Resueltos</p>
          <h2>156</h2>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        <button onClick={() => setTab("reports")} className={tab === "reports" ? "active" : ""}>
          Reportes
        </button>
        <button onClick={() => setTab("users")} className={tab === "users" ? "active" : ""}>
          Usuarios
        </button>
        <button onClick={() => setTab("announcements")} className={tab === "announcements" ? "active" : ""}>
          Anuncios
        </button>
      </div>

      {/* REPORTES */}
      {tab === "reports" && (
        <div className="section">
          {reportsData.map((r) => (
            <div key={r.id} className="report-card">
              <div className="report-header">
                <div>
                  <h3>{r.reason}</h3>
                  <p className="meta">
                    Reportado por <b>{r.reporter}</b> · {r.date}
                  </p>
                </div>

                <div className="badges">
                  <span className={r.status === "pending" ? "badge pending" : "badge done"}>
                    {r.status === "pending" ? "Pendiente" : "Resuelto"}
                  </span>
                  <span className="badge outline">{r.type}</span>
                </div>
              </div>

              <p><b>Objetivo:</b> {r.reported}</p>
              <p className="desc">{r.description}</p>

              {r.status === "pending" && (
                <div className="actions">
                  <button>Ver</button>
                  <button className="danger">Penalizar</button>
                  <button>Resolver</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="section">
          <div className="header">
            <h2>Gestión de Usuarios</h2>
            <button className="primary">Crear Anuncio</button>
          </div>

          {usersData.map((u) => (
            <div key={u.id} className="user-card">
              <div className="user-info">
                <div className="avatar">
                  {u.name.split(" ").map(n => n[0]).join("")}
                </div>

                <div>
                  <div className="user-name">
                    {u.name}
                    <span className="badge outline">{u.role}</span>
                    {u.status === "penalized" && (
                      <span className="badge danger">Penalizado</span>
                    )}
                  </div>

                  <p className="meta">
                    {u.username} · Se unió en {u.joined}
                  </p>
                </div>
              </div>

              <div className="actions">
                <button>Ver Perfil</button>
                <button>Asignar Rol</button>
                {u.status === "active" ? (
                  <button className="danger">Penalizar</button>
                ) : (
                  <button>Quitar Penalización</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANUNCIOS */}
      {tab === "announcements" && (
        <div className="section">
          <h2>Crear Anuncio</h2>

          <input placeholder="Título..." className="input" />
          <textarea placeholder="Mensaje..." className="input" />

          <button className="primary">Enviar</button>
        </div>
      )}
    </div>
  );
}
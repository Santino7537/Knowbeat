
export default function Sidebar({ tab, setTab }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <h2>KnowBeat</h2>
        <span>ADMIN PANEL</span>
      </div>

      <nav className="sidebar-links">
        <button
          className={tab === "users" ? "active" : ""}
          onClick={() => setTab("users")}
        >
           Usuarios
        </button>

        <button
          className={tab === "reports" ? "active" : ""}
          onClick={() => setTab("reports")}
        >
           Reportes
        </button>

        <button
          className={tab === "announcements" ? "active" : ""}
          onClick={() => setTab("announcements")}
        >
          Anuncios
        </button>

        <button>
           Configuración
        </button>
      </nav>
    </aside>
  );
}
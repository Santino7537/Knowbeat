import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loggedUser } = useAuth();
  const profilePath = loggedUser?.username
    ? `/user/${encodeURIComponent(loggedUser.username)}`
    : null;

  const items = [
    { name: "Comunidad", path: "/comunidad" },
    { name: "Aprender", path: "/courses" },
    { name: "Ejercicios", path: "/exercises" },
    { name: "Carpetas", path: "/folders" },
    { name: "Mensajes", path: "/messages" },
  ];

  return (
    <div className="sidebar">
      {/* BRAND */}
      <div className="sidebar-brand">
        <span>KnowBeat</span>
      </div>

      {/* DIVIDER */}
      <div className="sidebar-divider"></div>

      {/* NAV PRINCIPAL */}
      <div className="sidebar-nav">
        <div className="nav-label">Menú Principal</div>
        {items.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-text">{item.name}</span>
          </div>
        ))}
      </div>

      {/* DIVIDER */}
      <div className="sidebar-divider"></div>

      {/* NAV INFERIOR */}
      <div className="sidebar-bottom">
        <div
          className={`nav-item ${
            location.pathname === profilePath ? "active" : ""
          }`}
          onClick={() => profilePath && navigate(profilePath)}
        >
          <span className="nav-text">Perfil</span>
        </div>
        <div
          className={`nav-item ${
            location.pathname === "/settings" ? "active" : ""
          }`}
          onClick={() => navigate("/settings")}
        >
          <span className="nav-text">Configuración</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
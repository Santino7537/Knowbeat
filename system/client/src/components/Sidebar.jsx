import { useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { name: "Comunidad", path: "/comunidad" },
    { name: "Aprender", path: "/courses" },
    { name: "Ejercicios", path: "/exercises" },
    { name: "Carpetas", path: "/folders" },
    { name: "Mensajes", path: "/messages" },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">KnowBeat</div>

      <div className="sidebar-nav">
        {items.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
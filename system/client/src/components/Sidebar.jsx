import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Sidebar.css";

const navIcons = {
  comunidad: (
    <svg viewBox="-3 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20.906 20.75c1.313.719 2.063 2 1.969 3.281-.063.781-.094.813-1.094.938-.625.094-4.563.125-8.625.125-4.594 0-9.406-.094-9.75-.188-1.375-.344-.625-2.844 1.188-4.031 1.406-.906 4.281-2.281 5.063-2.438 1.063-.219 1.188-.875 0-3-.281-.469-.594-1.906-.625-3.406-.031-2.438.438-4.094 2.563-4.906a3.8 3.8 0 0 1 1.281-.219c1.406 0 2.719.781 3.25 1.938.781 1.531.469 5.625-.344 7.094-.938 1.656-.844 2.188.188 2.469.688.188 2.813 1.188 4.938 2.344zm-17-.937c-.5.344-.969.781-1.344 1.219-1.188 0-2.094-.031-2.188-.063-.781-.188-.344-1.625.688-2.25.781-.5 2.375-1.281 2.813-1.375.563-.125.688-.469 0-1.656-.156-.25-.344-1.063-.344-1.906-.031-1.375.25-2.313 1.438-2.719 1-.375 2.125.094 2.531.938.406.875.188 3.125-.25 3.938-.5.969-.406 1.219.156 1.375.125.031.375.156.719.313-1.375.563-3.25 1.594-4.219 2.188zm20.563-1.188c.75.406 1.156 1.094 1.094 1.813-.031.438-.031.469-.594.531-.156.031-.875.063-1.813.063a4.8 4.8 0 0 0-1.656-1.375c-1.281-.75-2.844-1.563-4-2.063.313-.125.594-.219.719-.25.594-.125.688-.469 0-1.656-.125-.25-.344-1.063-.344-1.906-.031-1.375.219-2.313 1.406-2.719 1.031-.375 2.156.094 2.531.938.406.875.25 3.125-.188 3.938-.5.969-.438 1.219.094 1.375.375.125 1.563.688 2.75 1.313z" fill="currentColor"/>
    </svg>
  ),
  aprender: (
    <svg fill="currentColor" height="800" width="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" xmlSpace="preserve" aria-hidden="true">
      <path d="m30.9 4.5-3-3c-.4-.4-1-.4-1.4 0l-3.8 3.8c-.2.2-.3.4-.3.7v1.1l-4.3 4.3c-2.5-1.3-5.5-.9-7.5 1q-.75.75-1.2 1.8c-.3.6-.8.9-1.5 1-.7 0-1.5.1-2.3.4-2.2.9-3.7 2.7-4.2 5-.5 2.7.4 5.7 2.6 7.8 1.8 1.8 4.1 2.7 6.3 2.7.5 0 1 0 1.5-.1 2.3-.5 4.1-2 5-4.2.3-.8.4-1.6.4-2.4 0-.6.4-1.2 1-1.4.1 0 .3-.1 1-.4 1.1-.3 1.9-1.2 2.3-2.3s-.1-2.3-1-2.8c-.7-.4-1.1-1.1-1.1-1.9v-.3L14.7 20c-.4.4-1 .4-1.4 0-.2-.2-.3-.5-.3-.8l9.6-9.6c.2.2.4.4.7.4h3c.3 0 .5-.1.7-.3l3.8-3.8c.5-.4.5-1 .1-1.4M10.7 26.1c-.2.2-.5.3-.7.3s-.5-.1-.7-.3l-3-3c-.4-.4-.4-1 0-1.4s1-.4 1.4 0l3 3c.4.4.4 1 0 1.4"/>
    </svg>
  ),
  ejercicios: (
    <svg fill="currentColor" height="800" width="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512.002 512.002" xmlSpace="preserve" aria-hidden="true">
      <path d="M489.26.861 183.289 102.696a16.61 16.61 0 0 0-11.362 15.756v271.915c-18.038-11.145-42.116-17.853-68.911-17.853C45.75 372.514.892 403.149.892 442.258s44.859 69.744 102.124 69.744 102.124-30.635 102.124-69.744V218.993l272.758-90.781v160.319c-18.038-11.145-42.116-17.853-68.911-17.853-57.266 0-102.124 30.635-102.124 69.744s44.859 69.744 102.124 69.744 102.124-30.635 102.124-69.744V16.617c0-11.317-11.103-19.332-21.851-15.756"/>
    </svg>
  ),
  carpetas: (
    <svg width="800" height="800" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0 1h5l3 2h5v2H3.746L2.03 11h2.08l1.143-4H16l-2 7H0z" fill="currentColor"/>
    </svg>
  ),
  mensajes: (
    <svg width="800" height="800" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.846 18.62a3.1 3.1 0 0 0-.788-1.611C4.183 15.543 3 13.394 3 11c0-4.418 4.03-8 9-8s9 3.582 9 8-4.03 8-9 8a10 10 0 0 1-2.44-.297.26.26 0 0 0-.279.109 7 7 0 0 1-.404.555 6 6 0 0 1-.763.802c-.519.448-1.107.774-1.722.824l-.062.004c-.041.003-.065-.045-.04-.079l.034-.048a3.06 3.06 0 0 0 .522-2.25m-2.184-.167C2.456 16.658 1 14.01 1 11 1 5.262 6.153 1 12 1s11 4.262 11 10-5.153 10-11 10q-.904 0-1.772-.13c-.292.338-.62.666-.983.96-.69.557-1.65 1.105-2.813 1.165-1.88.096-2.68-1.992-1.758-3.256a1.065 1.065 0 0 0-.012-1.286" fill="currentColor"/>
    </svg>
  ),
  config: (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 42.163 42.163" xmlSpace="preserve" aria-hidden="true">
      <path d="M37.364 15.082c-.993 0-1.229-.569-.526-1.271l1.271-1.273a2.995 2.995 0 0 0 0-4.241l-4.241-4.242a3 3 0 0 0-4.243.001l-1.271 1.271c-.701.702-1.271.466-1.271-.527V3a3 3 0 0 0-2.998-3l-6.001.001a3 3 0 0 0-3.002 3v1.797c0 .991-.569 1.226-1.271.525l-1.27-1.27a3 3 0 0 0-4.242-.001L4.057 8.295a3 3 0 0 0 .001 4.245l1.271 1.272c.702.702.466 1.271-.529 1.271H3a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h1.799c.993 0 1.229.569.527 1.271l-1.271 1.271a3 3 0 0 0 0 4.243l4.242 4.243a3 3 0 0 0 4.244 0s.569-.568 1.27-1.271c.701-.701 1.271-.466 1.271.526v1.796a3 3 0 0 0 3.004 3.001h5.998a3.004 3.004 0 0 0 3.002-3.001v-1.798c0-.993.569-1.229 1.271-.527l1.271 1.271a3 3 0 0 0 4.245.002l4.241-4.242a3 3 0 0 0 0-4.245l-1.271-1.271c-.701-.701-.467-1.271.524-1.271h1.795a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3zM21.08 30.916c-5.432 0-9.835-4.402-9.835-9.834s4.403-9.835 9.835-9.835 9.835 4.403 9.835 9.835-4.403 9.834-9.835 9.834" fill="currentColor"/>
    </svg>
  ),
  profileFallback: (
    <svg width="800" height="800" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor" aria-hidden="true">
      <g strokeWidth="0"/>
      <g strokeLinecap="round" strokeLinejoin="round"/>
      <title>profile_round [#1342]</title>
      <path d="M16.563 18H3.438c-.706 0-1.228-.697-.961-1.338C3.713 13.698 6.617 12 10 12s6.288 1.698 7.524 4.662c.267.641-.255 1.338-.961 1.338M5.917 6c0-2.206 1.832-4 4.083-4s4.083 1.794 4.083 4-1.831 4-4.083 4c-2.251 0-4.083-1.794-4.083-4m14.039 11.636c-.742-3.359-3.064-5.838-6.119-6.963 1.619-1.277 2.563-3.342 2.216-5.603-.402-2.623-2.63-4.722-5.318-5.028C7.023-.381 3.875 2.449 3.875 6c0 1.89.894 3.574 2.289 4.673-3.057 1.125-5.377 3.604-6.12 6.963C-.226 18.857.779 20 2.054 20h15.892c1.276 0 2.28-1.143 2.01-2.364" fillRule="evenodd" stroke="none" fill="currentColor"/>
    </svg>
  )
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loggedUser } = useAuth();
  const [profileImageError, setProfileImageError] = useState(false);

  const profilePath = loggedUser?.username
    ? `/user/${encodeURIComponent(loggedUser.username)}`
    : null;

  useEffect(() => {
    setProfileImageError(false);
  }, [loggedUser?.picture]);

  const items = [
    { name: "Comunidad", path: "/comunidad", icon: navIcons.comunidad },
    { name: "Aprender", path: "/courses", icon: navIcons.aprender },
    { name: "Ejercicios", path: "/exercises", icon: navIcons.ejercicios },
    { name: "Carpetas", path: "/folders", icon: navIcons.carpetas },
    { name: "Mensajes", path: "/messages", icon: navIcons.mensajes },
  ];

  const profileImage = loggedUser?.picture && String(loggedUser.picture).trim();

  return (
    <aside className="sidebar" aria-label="Sidebar principal">
      <div className="sidebar-brand">
        <img className="sidebar-logo" src="/Logo.png" alt="Knowbeat" />
      </div>

      <div className="sidebar-divider"></div>

      <nav className="sidebar-nav" aria-label="Menú principal">
        <div className="nav-label">Menú Principal</div>
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
            aria-current={location.pathname === item.path ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-divider"></div>

      <div className="sidebar-bottom">
        <div className="sidebar-user-row">
          <button
            type="button"
            className={`profile-button ${location.pathname === profilePath ? "active" : ""}`}
            onClick={() => profilePath && navigate(profilePath)}
            aria-label={loggedUser?.username ? `Ir al perfil de ${loggedUser.username}` : "Ir al perfil"}
            title={loggedUser?.username ? `Perfil de ${loggedUser.username}` : "Perfil"}
          >
            <span className="profile-avatar" aria-hidden="true">
              {profileImage && !profileImageError ? (
                <img src={profileImage} alt="" onError={() => setProfileImageError(true)} />
              ) : (
                navIcons.profileFallback
              )}
            </span>
            <span className="profile-name">{loggedUser?.username || "Perfil"}</span>
          </button>

          <button
            type="button"
            className={`settings-button ${location.pathname === "/settings" ? "active" : ""}`}
            onClick={() => navigate("/settings")}
            aria-label="Configuración"
            title="Configuración"
          >
            <span className="nav-icon" aria-hidden="true">{navIcons.config}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./CSS/UserProfile.module.css";

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileHeader({ user, isOwner, onEditClick }) {
  const initial = user.username?.[0]?.toUpperCase() ?? "U";

  return (
    <section className={styles.profileHeader} aria-label="Información del perfil">
      <div className={styles.profileMain}>

        {/* Avatar */}
        <div className={styles.avatarWrapper}>
          {user.picture ? (
            <img
              className={styles.avatar}
              src={user.picture}
              alt={`Foto de perfil de ${user.username}`}
            />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {initial}
            </div>
          )}
        </div>

        {/* Nombre + botón editar (solo si es el dueño del perfil) */}
        <div className={styles.profileInfo}>
          <div className={styles.usernameRow}>
            <h1 className={styles.username}>{user.username}</h1>
            {isOwner && (
              <button
                className={styles.editButton}
                onClick={onEditClick}
                aria-label="Editar perfil"
                title="Editar perfil"
                type="button"
              >
                {/* Ícono lápiz SVG inline — sin dependencia externa */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
          {user.biography && (
            <p className={styles.description}>{user.biography}</p>
          )}
        </div>

        {/* Stats */}
        <div className={styles.statsGroup}>
          <button className={styles.statChip} type="button">
            <span className={styles.statValue}>{formatCount(user.following ?? 0)}</span>
            <span className={styles.statLabel}>seguidos</span>
          </button>
          <button className={styles.statChip} type="button">
            <span className={styles.statValue}>{formatCount(user.followers ?? 0)}</span>
            <span className={styles.statLabel}>seguidores</span>
          </button>
        </div>

      </div>
    </section>
  );
}

function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className={styles.tabBar} role="tablist" aria-label="Secciones del perfil">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          id={`tab-${tab.id}`}
          className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ""}`}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function PostCard({ post }) {
  return (
    <article className={styles.postCard}>
      <div className={styles.postAvatar} aria-hidden="true">
        {post.authorInitial}
      </div>
      <div className={styles.postBody}>
        <span className={styles.postAuthor}>{post.authorName}</span>
        <p className={styles.postContent}>{post.content}</p>
      </div>
    </article>
  );
}

function FolderCard({ folder }) {
  return (
    <article className={styles.folderCard}>
      <div className={styles.folderIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25A2.25 2.25 0 0 0 4.5 16.5h15a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
      </div>
      <div className={styles.folderBody}>
        <span className={styles.folderName}>{folder.name}</span>
        <span className={styles.folderMeta}>
          {folder.itemCount} elemento{folder.itemCount !== 1 ? "s" : ""}
        </span>
      </div>
    </article>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const TABS = [
  { id: "folders", label: "Carpetas" },
  { id: "posts",   label: "Publicaciones" },
];

// ── Datos mock temporales (reemplazar por fetches reales) ─────────────────────
const MOCK_POSTS = [
  { id: 1, authorName: "María González", authorInitial: "M", content: "¿Alguien más usa Zustand para estado global en React? Hace semanas que no toco Redux y no lo extraño." },
  { id: 2, authorName: "María González", authorInitial: "M", content: "Recordatorio: las buenas API son las que no necesitan documentación para las cosas simples." },
];
const MOCK_FOLDERS = [
  { id: 1, name: "Recursos de diseño",  itemCount: 14 },
  { id: 2, name: "Snippets de React",   itemCount: 7  },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function UserProfile() {
  const {username} = useParams();          // /user/:username
  const navigate = useNavigate();
  const { loggedUser } = useAuth();            // usuario de la sesión activa

  const [profileUser, setProfileUser] = useState(null); // usuario que se está viendo
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  // Determina si quien navega es el dueño del perfil
  // Comparamos username porque es lo que devuelve getUserByToken
  // Si querés más robustez, el endpoint /user/:id podría devolver el id
  // y compararías loggedUser.id === profileUser.id
  const isOwner =
    loggedUser &&
    profileUser &&
    loggedUser.username === profileUser.username;

  // Fetch del perfil a mostrar
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`http://localhost:3000/user/${username}`);
        setProfileUser(data);
      } catch (err) {
        console.error("Error al cargar perfil:", err.response?.data ?? err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleEditClick = () => {
    // Navegás a la página de edición — ajustá la ruta según tu router
    navigate("/settings");
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <main className={styles.main}>
          <p className={styles.loadingText}>Cargando perfil…</p>
        </main>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className={styles.layout}>
        <main className={styles.main}>
          <p className={styles.loadingText}>Usuario no encontrado.</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <main className={styles.main}>

        <ProfileHeader
          user={profileUser}
          isOwner={isOwner}
          onEditClick={handleEditClick}
        />

        <div className={styles.contentArea}>
          <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className={styles.tabPanel}
          >
            {activeTab === "posts" && (
              <div className={styles.cardList}>
                {MOCK_POSTS.map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            )}
            {activeTab === "folders" && (
              <div className={styles.cardList}>
                {MOCK_FOLDERS.map((f) => <FolderCard key={f.id} folder={f} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
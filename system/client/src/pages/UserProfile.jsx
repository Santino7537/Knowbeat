import { useState } from "react";
import Sidebar from "../components/Sidebar";
import styles from "./CSS/UserProfile.module.css";

// ── Sub-components ──────────────────────────────────────────────────────────

function ProfileHeader({ user }) {
  return (
    <section className={styles.profileHeader} aria-label="Información del perfil">
      <div className={styles.profileMain}>
        <div className={styles.avatarWrapper}>
          {user.avatarUrl ? (
            <img
              className={styles.avatar}
              src={user.avatarUrl}
              alt={`Foto de perfil de ${user.username}`}
            />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
        </div>

        <div className={styles.profileInfo}>
          <h1 className={styles.username}>{user.username}</h1>
          <p className={styles.description}>{user.description}</p>
        </div>

        <div className={styles.statsGroup}>
          <button className={styles.statChip} type="button">
            <span className={styles.statValue}>{formatCount(user.following)}</span>
            <span className={styles.statLabel}>seguidos</span>
          </button>
          <button className={styles.statChip} type="button">
            <span className={styles.statValue}>{formatCount(user.followers)}</span>
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25A2.25 2.25 0 0 0 4.5 16.5h15a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
      </div>
      <div className={styles.folderBody}>
        <span className={styles.folderName}>{folder.name}</span>
        <span className={styles.folderMeta}>{folder.itemCount} elemento{folder.itemCount !== 1 ? "s" : ""}</span>
      </div>
    </article>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_USER = {
  username: "María González",
  description: "Desarrolladora full-stack · amante del open source · escribo sobre tecnología y diseño.",
  avatarUrl: "",
  following: 312,
  followers: 4800,
};

const MOCK_POSTS = [
  { id: 1, authorName: "María González", authorInitial: "M", content: "¿Alguien más usa Zustand para estado global en React? Hace semanas que no toco Redux y no lo extraño." },
  { id: 2, authorName: "María González", authorInitial: "M", content: "Recordatorio: las buenas API son las que no necesitan documentación para las cosas simples." },
  { id: 3, authorName: "María González", authorInitial: "M", content: "Acabo de publicar mi nueva librería de componentes. ¡Feedback bienvenido!" },
];

const MOCK_FOLDERS = [
  { id: 1, name: "Recursos de diseño", itemCount: 14 },
  { id: 2, name: "Snippets de React", itemCount: 7 },
  { id: 3, name: "Artículos guardados", itemCount: 22 },
];

const TABS = [
  { id: "folders", label: "Carpetas" },
  { id: "posts", label: "Publicaciones" },
];

// ── Main component ───────────────────────────────────────────────────────────

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <ProfileHeader user={MOCK_USER} />

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
                {MOCK_POSTS.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {activeTab === "folders" && (
              <div className={styles.cardList}>
                {MOCK_FOLDERS.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
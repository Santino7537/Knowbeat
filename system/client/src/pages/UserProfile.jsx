import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CourseCard from "../components/CourseCard.jsx";
import styles from "./CSS/UserProfile.module.css";

// ── Sub-components ────────────────────────────────────────────────────────────

function StreakDisplay({ streak, loading, error }) {
  const hasStreak = streak !== null && streak !== undefined && Number.isFinite(Number(streak));
  const days = hasStreak ? Math.max(0, Math.floor(Number(streak))) : null;
  const tier = days > 60 ? "red" : days > 30 ? "orange" : days > 5 ? "yellow" : "white";

  return (
    <div className={`${styles.streakDisplay} ${styles[`streak${tier}`]}`} aria-label="Racha de aprendizaje">
      <svg className={styles.streakIcon} viewBox="0 0 32 40" aria-hidden="true">
        <path d="M17.2 1.5c1.2 7.1-4.9 9.5-2.8 15.2 1.3-1.2 2.2-3.1 2.1-5.3 6.1 4.6 9.6 10 8.5 16.3C24 34 19.8 38 14.2 38 7.8 38 3 33.4 3 26.8c0-5.2 3.1-9.2 7.1-12.8-.2 4.2.3 6.5 1.7 8.1C11 15.1 18.7 11 17.2 1.5Z" fill="currentColor" />
        <path d="M16.4 23.2c2.8 2.2 4.1 4.2 3.7 7.1-.3 2.3-1.9 3.8-4 3.8-2.4 0-4.1-1.8-4.1-4.2 0-2.5 1.8-4.5 4.4-6.7Z" fill="currentColor" opacity=".58" />
      </svg>
      <div className={styles.streakCopy}>
        {error ? (
          <span className={styles.streakUnavailable}>{error}</span>
        ) : loading || days === null ? (
          <span className={styles.streakUnavailable}>Cargando racha…</span>
        ) : (
          <>
            <span className={styles.streakValue}>
              <strong>{days}</strong>
              <span>{days === 1 ? "día" : "días"}</span>
            </span>
            <span className={styles.streakLabel}>Racha</span>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileHeader({ user, isOwner, isMenuOpen, onMenuToggle, onEditClick, streak, streakLoading, streakError }) {
  const [imageError, setImageError] = useState(false);
  const initial = user.username?.[0]?.toUpperCase() ?? "U";

  return (
    <section className={styles.profileHeader} aria-label="Información del perfil">
      <div className={styles.profileMain}>
        <div className={styles.avatarWrapper}>
          {user.picture && !imageError ? (
            <img
              className={styles.avatar}
              src={user.picture}
              alt={`Foto de perfil de ${user.username}`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={styles.avatarFallback} role="img" aria-label={`Perfil de ${user.username}`}>
              {initial}
            </div>
          )}
        </div>

        <div className={styles.profileInfo}>
          <div className={styles.usernameRow}>
            <h1 className={styles.username}>{user.username}</h1>
            {isOwner && (
              <div className={styles.profileMenu}>
                <button
                  className={styles.menuButton}
                  onClick={onMenuToggle}
                  aria-label="Abrir opciones del perfil"
                  aria-expanded={isMenuOpen}
                  title="Opciones del perfil"
                  type="button"
                >
                  <span aria-hidden="true">•••</span>
                </button>
                {isMenuOpen && (
                  <div className={styles.menuDropdown} role="menu">
                    <button type="button" role="menuitem" onClick={onEditClick}>Editar perfil</button>
                  </div>
                )}
              </div>
            )}
          </div>
          {user.biography && (
            <p className={styles.description}>{user.biography}</p>
          )}
        </div>

        {isOwner && (
          <StreakDisplay streak={streak} loading={streakLoading} error={streakError} />
        )}
      </div>
    </section>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function UserProfile() {
  const {username} = useParams();          // /user/:username
  const navigate = useNavigate();
  const { loggedUser, refreshUser } = useAuth(); // usuario de la sesión activa

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", biography: "", password: "" });
  const [streak, setStreak] = useState(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [streakError, setStreakError] = useState("");

  const isOwner =
    loggedUser &&
    profileUser &&
    loggedUser.username === profileUser.username;
  const coursesInProgress = (profileUser?.courses ?? []).filter((course) => {
    const total = Number(course.total_lessons) || 0;
    const currentLesson = Math.max(1, Number(course.current_lesson) || 0);
    const completedLessons = Math.min(total, Math.max(0, currentLesson - 1));
    return !(total > 0 && completedLessons === total);
  });

  useEffect(() => {
    if (!isOwner) return undefined;

    let isMounted = true;

    const fetchStreak = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get("http://localhost:3000/user/get/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const streakValue = Number(data.streak);
        if (data.streak === null || data.streak === undefined || !Number.isFinite(streakValue) || streakValue < 0) {
          throw new Error("La API devolvió un valor de racha inválido.");
        }
        if (isMounted) {
          setStreak(streakValue);
          setStreakError("");
        }
      } catch (err) {
        console.error("Error al cargar la racha:", err.response?.data ?? err.message);
        if (isMounted) setStreakError("Racha no disponible");
      } finally {
        if (isMounted) setStreakLoading(false);
      }
    };

    fetchStreak();
    return () => {
      isMounted = false;
    };
  }, [isOwner]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No hay una sesión activa");
        }

        const { data } = await axios.get(
          `http://localhost:3000/user/get/user/username/${encodeURIComponent(username)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (isMounted) {
          setProfileUser(data);
          setForm({
            username: data.username ?? "",
            email: data.email ?? "",
            biography: data.biography ?? "",
            password: ""
          });
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err.response?.data ?? err.message);
        if (isMounted) {
          setProfileUser(null);
          setError(
            err.response?.status === 404
              ? "Usuario no encontrado."
              : "No se pudo cargar el perfil."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleEditClick = () => {
    setIsEditing((current) => !current);
    setIsMenuOpen(false);
    setError("");
  };

  const handleMenuToggle = () => {
    setIsMenuOpen((current) => !current);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      const { data } = await axios.patch("http://localhost:3000/user/update/profile", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfileUser((current) => ({ ...current, ...payload, ...data.userPayload }));
      setForm((current) => ({ ...current, password: "" }));
      setIsEditing(false);
      await refreshUser();
      if (payload.username !== username) {
        navigate(`/user/${encodeURIComponent(payload.username)}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message ?? "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <p className={styles.loadingText} role="status">Cargando perfil…</p>
        </main>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <p className={styles.loadingText} role="alert">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>

        <ProfileHeader
          key={`${profileUser.username}:${profileUser.picture ?? ""}`}
          user={profileUser}
          isOwner={isOwner}
          isMenuOpen={isMenuOpen}
          onMenuToggle={handleMenuToggle}
          onEditClick={handleEditClick}
          streak={streak}
          streakLoading={streakLoading}
          streakError={streakError}
        />

        {isOwner && isEditing && (
          <form className={styles.editPanel} onSubmit={handleProfileSave}>
            <div className={styles.editPanelHeading}>
              <h2 className={styles.contentTitle}>Editar perfil</h2>
              <button className={styles.closeButton} type="button" onClick={handleEditClick} aria-label="Cerrar edición">×</button>
            </div>
            <div className={styles.formGrid}>
              <label>Nombre de usuario<input name="username" value={form.username} onChange={handleFormChange} required minLength="3" /></label>
              <label>Email<input name="email" type="email" value={form.email} onChange={handleFormChange} required /></label>
              <label className={styles.fullField}>Biografía<textarea name="biography" value={form.biography} onChange={handleFormChange} maxLength="240" rows="3" placeholder="Contale a la comunidad quién sos" /></label>
              <label className={styles.fullField}>
                <span className={styles.fieldLabel}>Nueva contraseña <small>(opcional)</small></span>
                <input name="password" type="password" value={form.password} onChange={handleFormChange} minLength="8" />
              </label>
            </div>
            <div className={styles.formActions}>
              {error && <p className={styles.formError}>{error}</p>}
              <button className={styles.saveButton} type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </form>
        )}

        <section className={styles.contentArea} aria-label="Cursos del perfil">
          <div className={styles.contentHeading}>
            <div>
              <h2 className={styles.contentTitle}>Cursos en progreso</h2>
            </div>
            {profileUser.progressVisible && (
              <span className={styles.courseCount}>
                {coursesInProgress.length} {coursesInProgress.length === 1 ? "curso" : "cursos"}
              </span>
            )}
          </div>
          {!profileUser.progressVisible ? (
            <div className={styles.emptyState} role="status">
              <svg className={styles.emptyIcon} viewBox="0 0 36 36" aria-hidden="true">
                <path d="M23 4v17.5a4.5 4.5 0 1 1-2-3.7V8l-11 3v14.5a4.5 4.5 0 1 1-2-3.7V9L23 4Z" fill="currentColor" />
                <path d="M5 31 31 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h3>El progreso es privado</h3>
              <p>Este usuario eligió mantener sus cursos fuera de su perfil público.</p>
            </div>
          ) : coursesInProgress.length ? (
            <div className={styles.courseGrid}>
              {coursesInProgress.map((course) => (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  showProgress
                  onContinue={() => navigate(`/courses/${course.course_id}/lessons`, {
                    state: { courseName: course.name }
                  })}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              <svg className={styles.emptyIcon} viewBox="0 0 36 36" aria-hidden="true">
                <path d="M23 4v17.5a4.5 4.5 0 1 1-2-3.7V8l-11 3v14.5a4.5 4.5 0 1 1-2-3.7V9L23 4Z" fill="currentColor" />
              </svg>
              <h3>Todavía no hay cursos en progreso</h3>
              <p>Cuando este usuario se inscriba en un curso, aparecerá aquí.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
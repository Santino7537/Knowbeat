import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import styles from "./CSS/UserProfile.module.css";

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileHeader({ user, isOwner, isMenuOpen, onMenuToggle, onEditClick }) {
  const initial = user.username?.[0]?.toUpperCase() ?? "U";
  const courses = user.courses ?? [];
  const completedCourses = courses.filter((course) => {
    return course.total_lessons > 0 && course.current_lesson >= course.total_lessons;
  }).length;

  return (
    <section className={styles.profileHeader} aria-label="Información del perfil">
      <div className={styles.profileMain}>

        {/* Identidad visual sin depender de una foto subida */}
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarFallback} aria-hidden="true">
            {initial}
          </div>
        </div>

        {/* Nombre + botón editar (solo si es el dueño del perfil) */}
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
          <div className={styles.profileStats} aria-label="Resumen del perfil">
            <span><strong>{courses.length}</strong> cursos</span>
            <span><strong>{completedCourses}</strong> completados</span>
          </div>
        </div>

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

  const isOwner =
    loggedUser &&
    profileUser &&
    loggedUser.username === profileUser.username;

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
          <p className={styles.loadingText}>Cargando perfil…</p>
        </main>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <p className={styles.loadingText}>{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>

        <ProfileHeader
          user={profileUser}
          isOwner={isOwner}
          isMenuOpen={isMenuOpen}
          onMenuToggle={handleMenuToggle}
          onEditClick={handleEditClick}
        />

        {isOwner && isEditing && (
          <form className={styles.editPanel} onSubmit={handleProfileSave}>
            <div className={styles.editPanelHeading}>
              <div>
                <p className={styles.sectionEyebrow}>DATOS PERSONALES</p>
                <h2 className={styles.contentTitle}>Editar perfil</h2>
              </div>
              <button className={styles.closeButton} type="button" onClick={handleEditClick} aria-label="Cerrar edición">×</button>
            </div>
            <div className={styles.formGrid}>
              <label>Nombre de usuario<input name="username" value={form.username} onChange={handleFormChange} required minLength="3" /></label>
              <label>Email<input name="email" type="email" value={form.email} onChange={handleFormChange} required /></label>
              <label className={styles.fullField}>Biografía<textarea name="biography" value={form.biography} onChange={handleFormChange} maxLength="240" rows="3" placeholder="Contale a la comunidad quién sos" /></label>
              <label className={styles.fullField}>Nueva contraseña <span>(opcional)</span><input name="password" type="password" value={form.password} onChange={handleFormChange} minLength="8" /></label>
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
              <p className={styles.sectionEyebrow}>RUTA DE APRENDIZAJE</p>
              <h2 className={styles.contentTitle}>Cursos en progreso</h2>
            </div>
            <span className={styles.courseCount}>{profileUser.courses?.length ?? 0}</span>
          </div>
          {!profileUser.progressVisible ? (
            <div className={styles.emptyState}>
              <p>Este usuario mantiene sus cursos en privado.</p>
            </div>
          ) : profileUser.courses?.length ? (
            <div className={styles.courseList}>
              {profileUser.courses.map((course) => {
                const current = course.current_lesson ?? 0;
                const total = course.total_lessons ?? 0;
                const percent = total ? Math.min(100, Math.round((current / total) * 100)) : 0;
                const completed = percent >= 100;

                return (
                  <article className={styles.courseCard} key={course.course_id}>
                    <div className={styles.courseIcon} aria-hidden="true">{course.name?.[0]?.toUpperCase() ?? "C"}</div>
                    <div className={styles.courseBody}>
                      <div className={styles.courseTitleRow}>
                        <h3>{course.name}</h3>
                        <span className={completed ? styles.completed : styles.inProgress}>
                          {completed ? "Completado" : "En progreso"}
                        </span>
                      </div>
                      <div className={styles.progressMeta}>
                        <span>{current} de {total} lecciones</span>
                        <strong>{percent}%</strong>
                      </div>
                      <div className={styles.progressTrack} role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
                        <span style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Este usuario todavía no está inscripto en ningún curso.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
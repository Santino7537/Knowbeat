import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CourseCard from "../components/CourseCard.jsx";
import AddFriendIcon from "../assets/add-friend.svg";
import RemoveFriendIcon from "../assets/remove-friend.svg";
import styles from "./CSS/UserProfile.module.css";

const API = "http://localhost:3000";

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

// ── FriendButton ──────────────────────────────────────────────────────────────
// Aparece solo cuando se visita el perfil de otro usuario.
// Estados posibles: "none" | "friends" | "pending_sent" | "loading"
// - none         → botón agrega amigo  → llama a sendFriendRequest
// - friends      → botón elimina amigo → llama a deleteFriendship
// - pending_sent → solicitud enviada   → llama a cancelFriendRequest

function FriendButton({ profileUsername }) {
  // friendshipStatus: null mientras carga, luego objeto con los campos necesarios
  const [status, setStatus]     = useState("loading");
  // Guardamos IDs que necesitamos para las acciones
  const [friendshipId, setFriendshipId]   = useState(null);
  const [requestId, setRequestId]         = useState(null);

  // Al montar consultamos si ya son amigos y si hay solicitud pendiente
  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        // Pedimos la lista de amigos y las solicitudes en paralelo
        const [friendsRes, requestsRes] = await Promise.all([
          axios.get(`${API}/friend/list`,     { headers: authHeaders() }),
          axios.get(`${API}/friend/requests`, { headers: authHeaders() }),
        ]);

        if (!mounted) return;

        // friendsRes.data es un objeto { [user_id]: { friendship_id, username, ... } }
        // Buscamos si alguno tiene el username del perfil visitado
        const friendEntry = Object.entries(friendsRes.data)
          .find(([, f]) => f.username === profileUsername);

        if (friendEntry) {
          setStatus("friends");
          setFriendshipId(friendEntry[1].friendship_id);
          return;
        }

        // Solicitudes salientes pendientes
        const outgoing = requestsRes.data.outgoing ?? [];
        const sent = outgoing.find(r => r.user.username === profileUsername);
        if (sent) {
          setStatus("pending_sent");
          setRequestId(sent.id);
          return;
        }

        setStatus("none");
      } catch (err) {
        console.error("Error al verificar amistad:", err.response?.data ?? err.message);
        setStatus("none"); // fallback no-bloqueante
      }
    };

    check();
    return () => { mounted = false; };
  }, [profileUsername]);

  const handleClick = async () => {
    if (status === "loading") return;

    try {
      if (status === "none") {
        // Necesitamos el user_id del perfil visitado.
        // Lo obtenemos del endpoint de perfil público (ya existe en el componente padre,
        // pero para mantener FriendButton independiente hacemos una consulta mínima).
        const { data: target } = await axios.get(
          `${API}/user/get/user/username/${encodeURIComponent(profileUsername)}`,
          { headers: authHeaders() }
        );
        const { data } = await axios.post(
          `${API}/friend/request/${target.id}`,
          {},
          { headers: authHeaders() }
        );
        setStatus("pending_sent");
        setRequestId(data.request_id);

      } else if (status === "pending_sent") {
        await axios.patch(
          `${API}/friend/request/${requestId}/cancel`,
          {},
          { headers: authHeaders() }
        );
        setStatus("none");
        setRequestId(null);

      } else if (status === "friends") {
        await axios.delete(
          `${API}/friend/${friendshipId}`,
          { headers: authHeaders() }
        );
        setStatus("none");
        setFriendshipId(null);
      }
    } catch (err) {
      console.error("Error en acción de amistad:", err.response?.data ?? err.message);
    }
  };

  // Mientras carga no mostramos nada para evitar flash
  if (status === "loading") return null;

  const isFriend     = status === "friends";
  const isPending    = status === "pending_sent";
  const label        = isFriend  ? "Eliminar amigo"
                     : isPending ? "Cancelar solicitud"
                     : "Enviar solicitud de amistad";

  return (
    <button
      className={`${styles.friendButton} ${isFriend || isPending ? styles.friendButtonActive : ""}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
      type="button"
    >
      <img
        src={isFriend ? RemoveFriendIcon : AddFriendIcon}
        alt=""
        aria-hidden="true"
        className={styles.friendButtonIcon}
      />
    </button>
  );
}

// ── FriendRequestItem ─────────────────────────────────────────────────────────

function FriendRequestItem({ request, onAccept, onReject }) {
  const [busy, setBusy] = useState(false);
  const initial = request.user.username?.[0]?.toUpperCase() ?? "?";

  const handle = async (action) => {
    setBusy(true);
    try { await action(); }
    finally { setBusy(false); }
  };

  return (
    <div className={styles.requestItem}>
      {request.user.picture ? (
        <img
          className={styles.requestAvatar}
          src={request.user.picture}
          alt={`Foto de ${request.user.username}`}
        />
      ) : (
        <div className={styles.requestAvatarFallback}>{initial}</div>
      )}
      <span className={styles.requestUsername}>{request.user.username}</span>
      <div className={styles.requestActions}>
        {/* Aceptar */}
        <button
          className={`${styles.friendButton} ${styles.friendButtonSmall}`}
          onClick={() => handle(onAccept)}
          disabled={busy}
          aria-label="Aceptar solicitud"
          title="Aceptar"
          type="button"
        >
          <img src={AddFriendIcon} alt="" aria-hidden="true" className={styles.friendButtonIcon} />
        </button>
        {/* Rechazar */}
        <button
          className={`${styles.friendButton} ${styles.friendButtonSmall} ${styles.friendButtonActive}`}
          onClick={() => handle(onReject)}
          disabled={busy}
          aria-label="Rechazar solicitud"
          title="Rechazar"
          type="button"
        >
          <img src={RemoveFriendIcon} alt="" aria-hidden="true" className={styles.friendButtonIcon} />
        </button>
      </div>
    </div>
  );
}

// ── FriendRequestsPanel ───────────────────────────────────────────────────────

function FriendRequestsPanel({ onClose }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/friend/requests`, { headers: authHeaders() });
      setRequests(data.incoming ?? []);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err.response?.data ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAccept = async (requestId) => {
    await axios.patch(`${API}/friend/request/${requestId}/accept`, {}, { headers: authHeaders() });
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleReject = async (requestId) => {
    await axios.patch(`${API}/friend/request/${requestId}/reject`, {}, { headers: authHeaders() });
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  return (
    <section className={styles.editPanel} aria-label="Solicitudes de amistad">
      <div className={styles.editPanelHeading}>
        <h2 className={styles.contentTitle}>Solicitudes de amistad</h2>
        <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Cerrar">×</button>
      </div>

      {loading ? (
        <p className={styles.requestsEmpty}>Cargando…</p>
      ) : requests.length === 0 ? (
        <p className={styles.requestsEmpty}>No hay solicitudes pendientes</p>
      ) : (
        <div className={styles.requestsList}>
          {requests.map(req => (
            <FriendRequestItem
              key={req.id}
              request={req}
              onAccept={() => handleAccept(req.id)}
              onReject={() => handleReject(req.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── StreakDisplay ─────────────────────────────────────────────────────────────

function StreakDisplay({ streak, loading, error }) {
  const hasStreak = streak !== null && streak !== undefined && Number.isFinite(Number(streak));
  const days      = hasStreak ? Math.max(0, Math.floor(Number(streak))) : null;
  const tier      = days > 60 ? "red" : days > 30 ? "orange" : days > 5 ? "yellow" : "white";

  return (
    <div className={`${styles.streakDisplay} ${styles[`streak${tier}`]}`} aria-label="Racha de aprendizaje">
      <svg className={styles.streakIcon} viewBox="0 0 32 40" aria-hidden="true">
        <path d="M17.2 1.5c1.2 7.1-4.9 9.5-2.8 15.2 1.3-1.2 2.2-3.1 2.1-5.3 6.1 4.6 9.6 10 8.5 16.3C24 34 19.8 38 14.2 38 7.8 38 3 33.4 3 26.8c0-5.2 3.1-9.2 7.1-12.8-.2 4.2.3 6.5 1.7 8.1C11 15.1 18.7 11 17.2 1.5Z" fill="currentColor"/>
        <path d="M16.4 23.2c2.8 2.2 4.1 4.2 3.7 7.1-.3 2.3-1.9 3.8-4 3.8-2.4 0-4.1-1.8-4.1-4.2 0-2.5 1.8-4.5 4.4-6.7Z" fill="currentColor" opacity=".58"/>
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

// ── ProfileHeader ─────────────────────────────────────────────────────────────

function ProfileHeader({
  user, isOwner, isMenuOpen, onMenuToggle, onEditClick, onRequestsClick,
  streak, streakLoading, streakError
}) {
  const [imageError, setImageError] = useState(false);
  const initial = user.username?.[0]?.toUpperCase() ?? "U";

  return (
    <section className={styles.profileHeader} aria-label="Información del perfil">
      <div className={styles.profileMain}>

        {/* Avatar */}
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

        {/* Info */}
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
                    <button type="button" role="menuitem" onClick={onEditClick}>
                      Editar perfil
                    </button>
                    <button type="button" role="menuitem" onClick={onRequestsClick}>
                      Ver solicitudes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {user.biography && (
            <p className={styles.description}>{user.biography}</p>
          )}
        </div>

        {/* Derecha: racha (dueño) o botón amistad (visitante) */}
        {isOwner ? (
          <StreakDisplay streak={streak} loading={streakLoading} error={streakError} />
        ) : (
          <FriendButton profileUsername={user.username} />
        )}

      </div>
    </section>
  );
}

// ── UserProfile (main) ────────────────────────────────────────────────────────

export default function UserProfile() {
  const { username }             = useParams();
  const navigate                 = useNavigate();
  const { loggedUser, refreshUser } = useAuth();

  const [profileUser, setProfileUser]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [panel, setPanel]               = useState(null); // null | "edit" | "requests"
  const [isMenuOpen, setIsMenuOpen]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [form, setForm]                 = useState({ username: "", email: "", biography: "", password: "" });
  const [streak, setStreak]             = useState(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [streakError, setStreakError]   = useState("");

  const isOwner =
    loggedUser && profileUser &&
    loggedUser.username === profileUser.username;

  const coursesInProgress = (profileUser?.courses ?? []).filter((course) => {
    const total    = Number(course.total_lessons)   || 0;
    const current  = Math.max(1, Number(course.current_lesson) || 0);
    const done     = Math.min(total, Math.max(0, current - 1));
    return !(total > 0 && done === total);
  });

  // Fetch racha (solo si es dueño)
  useEffect(() => {
    if (!isOwner) return;
    let mounted = true;

    (async () => {
      try {
        const { data } = await axios.get(`${API}/user/get/stats`, { headers: authHeaders() });
        const v = Number(data.streak);
        if (!Number.isFinite(v) || v < 0) throw new Error("Valor inválido");
        if (mounted) { setStreak(v); setStreakError(""); }
      } catch (err) {
        console.error("Error racha:", err.response?.data ?? err.message);
        if (mounted) setStreakError("Racha no disponible");
      } finally {
        if (mounted) setStreakLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [isOwner]);

  // Fetch perfil
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Sin sesión");
        const { data } = await axios.get(
          `${API}/user/get/user/username/${encodeURIComponent(username)}`,
          { headers: authHeaders() }
        );
        if (mounted) {
          setProfileUser(data);
          setForm({ username: data.username ?? "", email: data.email ?? "", biography: data.biography ?? "", password: "" });
        }
      } catch (err) {
        console.error("Error perfil:", err.response?.data ?? err.message);
        if (mounted) {
          setProfileUser(null);
          setError(err.response?.status === 404 ? "Usuario no encontrado." : "No se pudo cargar el perfil.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [username]);

  // Handlers
  const togglePanel = (name) => {
    setPanel(prev => prev === name ? null : name);
    setIsMenuOpen(false);
    setError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const { data } = await axios.patch(`${API}/user/update/profile`, payload, { headers: authHeaders() });
      setProfileUser(prev => ({ ...prev, ...payload, ...data.userPayload }));
      setForm(prev => ({ ...prev, password: "" }));
      setPanel(null);
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

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <p className={styles.loadingText} role="status">Cargando perfil…</p>
      </main>
    </div>
  );

  if (!profileUser) return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <p className={styles.loadingText} role="alert">{error}</p>
      </main>
    </div>
  );

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>

        <ProfileHeader
          key={`${profileUser.username}:${profileUser.picture ?? ""}`}
          user={profileUser}
          isOwner={isOwner}
          isMenuOpen={isMenuOpen}
          onMenuToggle={() => setIsMenuOpen(p => !p)}
          onEditClick={() => togglePanel("edit")}
          onRequestsClick={() => togglePanel("requests")}
          streak={streak}
          streakLoading={streakLoading}
          streakError={streakError}
        />

        {/* Panel editar perfil */}
        {isOwner && panel === "edit" && (
          <form className={styles.editPanel} onSubmit={handleProfileSave}>
            <div className={styles.editPanelHeading}>
              <h2 className={styles.contentTitle}>Editar perfil</h2>
              <button className={styles.closeButton} type="button" onClick={() => setPanel(null)} aria-label="Cerrar edición">×</button>
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

        {/* Panel solicitudes */}
        {isOwner && panel === "requests" && (
          <FriendRequestsPanel onClose={() => setPanel(null)} />
        )}

        {/* Cursos */}
        <section className={styles.contentArea} aria-label="Cursos del perfil">
          <div className={styles.contentHeading}>
            <h2 className={styles.contentTitle}>Cursos en progreso</h2>
            {profileUser.progressVisible && (
              <span className={styles.courseCount}>
                {coursesInProgress.length} {coursesInProgress.length === 1 ? "curso" : "cursos"}
              </span>
            )}
          </div>
          {!profileUser.progressVisible ? (
            <div className={styles.emptyState} role="status">
              <svg className={styles.emptyIcon} viewBox="0 0 36 36" aria-hidden="true">
                <path d="M23 4v17.5a4.5 4.5 0 1 1-2-3.7V8l-11 3v14.5a4.5 4.5 0 1 1-2-3.7V9L23 4Z" fill="currentColor"/>
                <path d="M5 31 31 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <h3>El progreso es privado</h3>
              <p>Este usuario eligió mantener sus cursos fuera de su perfil público.</p>
            </div>
          ) : coursesInProgress.length ? (
            <div className={styles.courseGrid}>
              {coursesInProgress.map(course => (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  showProgress
                  onContinue={() => navigate(`/courses/${course.course_id}/lessons`, { state: { courseName: course.name } })}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              <svg className={styles.emptyIcon} viewBox="0 0 36 36" aria-hidden="true">
                <path d="M23 4v17.5a4.5 4.5 0 1 1-2-3.7V8l-11 3v14.5a4.5 4.5 0 1 1-2-3.7V9L23 4Z" fill="currentColor"/>
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
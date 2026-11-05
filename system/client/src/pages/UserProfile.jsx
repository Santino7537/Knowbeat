import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import CourseCard from "../components/CourseCard.jsx";
import AddFriendIcon from "../assets/add-friend.svg";
import RemoveFriendIcon from "../assets/remove-friend.svg";
import Avatar from "../components/general/Avatar.jsx";
import MusicStaff from "../components/general/MusicStaff.jsx";
import DailyScoreActivity from "../components/profile/DailyScoreActivity.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { API_URL, getErrorMessage } from "../api/client";
import { useLanguage } from "../context/LanguageContext.jsx"; // <-- Importar hook de idioma
import styles from "./CSS/UserProfile.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

// ── FriendButton ──────────────────────────────────────────────────────────────

function FriendButton({ profileUsername }) {
  const [status, setStatus]     = useState("loading");
  const [busy, setBusy]         = useState(false);
  const toast                   = useToast();
  const navigate                = useNavigate();
  const { t }                   = useLanguage(); // <-- Consumir traducción
  const [friendshipId, setFriendshipId]   = useState(null);
  const [requestId, setRequestId]         = useState(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const [friendsRes, requestsRes] = await Promise.all([
          axios.get(`${API_URL}/friend/list`,     { headers: authHeaders() }),
          axios.get(`${API_URL}/friend/requests`, { headers: authHeaders() }),
        ]);

        if (!mounted) return;

        const friendEntry = Object.entries(friendsRes.data)
          .find(([, f]) => f.username === profileUsername);

        if (friendEntry) {
          setStatus("friends");
          setFriendshipId(friendEntry[1].friendship_id);
          return;
        }

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
        setStatus("none");
      }
    };

    check();
    return () => { mounted = false; };
  }, [profileUsername]);

  const handleClick = async () => {
    if (status === "loading" || busy) return;

    setBusy(true);
    try {
      if (status === "none") {
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
      toast.error(getErrorMessage(err, t("profile_page.errors.friend_action_failed")));
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") return <span className={styles.friendPlaceholder} aria-hidden="true" />;

  const isFriend     = status === "friends";
  const isPending    = status === "pending_sent";
  const label        = isFriend  ? t("profile_page.friends.delete")
                     : isPending ? t("profile_page.friends.cancel_request")
                     : t("profile_page.friends.add");

  return (
    <div className={styles.friendActions}>
      {isFriend && (
        <button type="button" className={styles.primaryAction} onClick={() => navigate("/messages")}>
          {t("profile_page.friends.send_message")}
        </button>
      )}
      <button
        className={isFriend || isPending ? styles.secondaryAction : styles.primaryAction}
        onClick={handleClick}
        disabled={busy}
        title={label}
        type="button"
      >
        <img
          src={isFriend ? RemoveFriendIcon : AddFriendIcon}
          alt=""
          aria-hidden="true"
          className={styles.actionIcon}
        />
        {isFriend ? t("profile_page.friends.status_friends") : isPending ? t("profile_page.friends.status_pending") : t("profile_page.friends.add")}
      </button>
    </div>
  );
}

// ── FriendRequestItem ─────────────────────────────────────────────────────────

function FriendRequestItem({ request, onAccept, onReject }) {
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();

  const handle = async (action) => {
    setBusy(true);
    try { await action(); }
    finally { setBusy(false); }
  };

  return (
    <div className={styles.requestItem}>
      <Avatar name={request.user.username} src={request.user.picture} size={40} />
      <span className={styles.requestUsername}>{request.user.username}</span>
      <div className={styles.requestActions}>
        <button
          className={`${styles.friendButton} ${styles.friendButtonSmall}`}
          onClick={() => handle(onAccept)}
          disabled={busy}
          aria-label={t("profile_page.requests.accept_aria")}
          title={t("profile_page.requests.accept_title")}
          type="button"
        >
          <img src={AddFriendIcon} alt="" aria-hidden="true" className={styles.friendButtonIcon} />
        </button>
        <button
          className={`${styles.friendButton} ${styles.friendButtonSmall} ${styles.friendButtonActive}`}
          onClick={() => handle(onReject)}
          disabled={busy}
          aria-label={t("profile_page.requests.reject_aria")}
          title={t("profile_page.requests.reject_title")}
          type="button"
        >
          <img src={RemoveFriendIcon} alt="" aria-hidden="true" className={styles.friendButtonIcon} />
        </button>
      </div>
    </div>
  );
}

function ProfileModal({ title, onClose, children }) {
  const dialogRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.profileModal}
      aria-labelledby="profile-modal-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className={styles.profileModalHeader}>
        <h2 id="profile-modal-title" className={styles.contentTitle}>{title}</h2>
        <button
          className={styles.closeButton}
          type="button"
          onClick={onClose}
          aria-label={t("profile_page.modal.close_aria")}
          autoFocus
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}

// ── FriendRequestsPanel ───────────────────────────────────────────────────────

function FriendRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { t } = useLanguage();

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
    <div className={styles.modalBody}>
      {loading ? (
        <p className={styles.requestsEmpty}>{t("profile_page.requests.loading")}</p>
      ) : requests.length === 0 ? (
        <p className={styles.requestsEmpty}>{t("profile_page.requests.empty")}</p>
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
    </div>
  );
}

// ── StreakDisplay ─────────────────────────────────────────────────────────────

function StreakDisplay({ streak, loading, error }) {
  const { t } = useLanguage();
  const hasStreak = streak !== null && streak !== undefined && Number.isFinite(Number(streak));
  const days      = hasStreak ? Math.max(0, Math.floor(Number(streak))) : null;
  const tier      = days > 60 ? "red" : days > 30 ? "orange" : days > 5 ? "yellow" : "white";

  return (
    <div className={`${styles.statCard} ${styles.streakDisplay} ${styles[`streak${tier}`]}`} aria-label={t("profile_page.streak.aria")}>
      <svg className={styles.streakIcon} viewBox="0 0 32 40" aria-hidden="true">
        <path d="M17.2 1.5c1.2 7.1-4.9 9.5-2.8 15.2 1.3-1.2 2.2-3.1 2.1-5.3 6.1 4.6 9.6 10 8.5 16.3C24 34 19.8 38 14.2 38 7.8 38 3 33.4 3 26.8c0-5.2 3.1-9.2 7.1-12.8-.2 4.2.3 6.5 1.7 8.1C11 15.1 18.7 11 17.2 1.5Z" fill="currentColor"/>
        <path d="M16.4 23.2c2.8 2.2 4.1 4.2 3.7 7.1-.3 2.3-1.9 3.8-4 3.8-2.4 0-4.1-1.8-4.1-4.2 0-2.5 1.8-4.5 4.4-6.7Z" fill="currentColor" opacity=".58"/>
      </svg>
      <div className={styles.streakCopy}>
        {error ? (
          <span className={styles.streakUnavailable}>{error}</span>
        ) : loading || days === null ? (
          <span className={styles.streakUnavailable}>{t("profile_page.streak.loading")}</span>
        ) : (
          <>
            <span className={styles.streakValue}>
              <strong>{days}</strong>
              <span>{days === 1 ? t("profile_page.streak.day") : t("profile_page.streak.days")}</span>
            </span>
            <span className={styles.streakLabel}>
              {days > 0 ? t("profile_page.streak.positive") : t("profile_page.streak.zero")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── ProfileHeader ─────────────────────────────────────────────────────────────

function ProfileHeader({
  user, isOwner, onEditClick, onRequestsClick, onReportClick, panel
}) {
  const { t } = useLanguage();

  return (
    <section className={styles.profileHeader} aria-label={t("profile_page.header_aria")}>
      <div className={styles.cover} aria-hidden="true">
        <MusicStaff staves={1} notes={12} lineGap={18} className={styles.coverStaff} />
      </div>

      <div className={styles.profileMain}>
        <Avatar name={user.username} src={user.picture} size={128} ring className={styles.profileAvatar} />

        <div className={styles.profileInfo}>
          <h1 className={styles.username}>{user.username}</h1>
          {user.biography ? (
            <p className={styles.description}>{user.biography}</p>
          ) : isOwner ? (
            <button type="button" className={styles.addBio} onClick={onEditClick}>
              {t("profile_page.bio.add_prompt")}
            </button>
          ) : (
            <p className={styles.descriptionMuted}>{t("profile_page.bio.empty_other")}</p>
          )}
        </div>

        <div className={styles.headerActions}>
          {isOwner ? (
            <>
              <button
                type="button"
                className={panel === "edit" ? styles.primaryAction : styles.secondaryAction}
                onClick={onEditClick}
              >
                {t("profile_page.actions.edit")}
              </button>
              <button
                type="button"
                className={panel === "requests" ? styles.primaryAction : styles.secondaryAction}
                onClick={onRequestsClick}
              >
                {t("profile_page.actions.requests")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.reportUserButton}
                onClick={onReportClick}
                title="Reportar usuario"
                aria-label={`Reportar a ${user.username}`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3 22 21H2L12 3Z" />
                  <path d="M12 9v5m0 3h.01" />
                </svg>
              </button>
              <FriendButton profileUsername={user.username} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Estadísticas rápidas ──────────────────────────────────────────────────────

function ProfileStats({ isOwner, streak, streakLoading, streakError, score, courses, progressVisible }) {
  const { t } = useLanguage();
  const completed = courses.reduce(
    (sum, c) => sum + Math.max(0, Math.min(Number(c.total_lessons) || 0, (Number(c.current_lesson) || 1) - 1)),
    0
  );

  return (
    <section className={styles.stats} aria-label={t("profile_page.stats.aria")}>
      {isOwner && (
        <StreakDisplay streak={streak} loading={streakLoading} error={streakError} />
      )}
      {score !== null && score !== undefined && (
        <div className={styles.statCard}>
          <div>
            <strong>{score}</strong>
            <span>{t("profile_page.stats.total_score")}</span>
          </div>
        </div>
      )}
      <div className={styles.statCard}>
        <div>
          <strong>{progressVisible ? courses.length : "—"}</strong>
          <span>{courses.length === 1 ? t("profile_page.stats.course_singular") : t("profile_page.stats.course_plural")}</span>
        </div>
      </div>
      <div className={styles.statCard}>
        <div>
          <strong>{progressVisible ? completed : "—"}</strong>
          <span>{completed === 1 ? t("profile_page.stats.lesson_singular") : t("profile_page.stats.lesson_plural")}</span>
        </div>
      </div>
    </section>
  );
}

// ── UserProfile (main) ────────────────────────────────────────────────────────

export default function UserProfile() {
  const { username }             = useParams();
  const navigate                 = useNavigate();
  const { loggedUser, refreshUser } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();

  const [profileUser, setProfileUser]        = useState(null);
  const [loading, setLoading]                = useState(true);
  const [error, setError]                    = useState("");
  const [panel, setPanel]                    = useState(null);
  const [, setIsMenuOpen]                    = useState(false);
  const [saving, setSaving]                  = useState(false);
  const [form, setForm]                      = useState({ username: "", email: "", biography: "", password: "" });
  const [streak, setStreak]                  = useState(null);
  const [streakLoading, setStreakLoading]    = useState(true);
  const [streakError, setStreakError]        = useState("");
  const [score, setScore]                    = useState(null);
  const [scoreGoal, setScoreGoal]            = useState(null);
  const [goalInput, setGoalInput]            = useState("");
  const [goalError, setGoalError]            = useState("");
  const [goalLoading, setGoalLoading]        = useState(false);
  const [scoreHistory, setScoreHistory]      = useState([]);
  const [scoreHistoryLoading, setScoreHistoryLoading] = useState(true);
  const [reportReason, setReportReason] = useState("INAPPROPRIATE_CONTENT");
  const [reportDescription, setReportDescription] = useState("");
  const [reportError, setReportError] = useState("");
  const [sendingReport, setSendingReport] = useState(false);

  const isOwner =
    loggedUser && profileUser &&
    loggedUser.username === profileUser.username;

  const coursesInProgress = (profileUser?.courses ?? []).filter((course) => {
    const total    = Number(course.total_lessons)   || 0;
    const current  = Math.max(1, Number(course.current_lesson) || 0);
    const done     = Math.min(total, Math.max(0, current - 1));
    return !(total > 0 && done === total);
  });

  useEffect(() => {
    if (!isOwner) return;
    let mounted = true;

    (async () => {
      try {
        const { data } = await axios.get(`${API}/user/get/stats`, { headers: authHeaders() });
        const streakValue = Number(data.streak);
        const totalScore = Number(data.score);
        const goalValue = data.score_goal === null || data.score_goal === undefined ? null : Number(data.score_goal);

        if (!Number.isFinite(streakValue) || streakValue < 0) throw new Error("Valor inválido");
        if (mounted) {
          setStreak(streakValue);
          setStreakError("");
          setScore(Number.isFinite(totalScore) ? totalScore : 0);
          setScoreGoal(Number.isFinite(goalValue) ? goalValue : null);
          setGoalInput(Number.isFinite(goalValue) ? String(goalValue) : "");
        }
      } catch (err) {
        console.error("Error stats:", err.response?.data ?? err.message);
        if (mounted) {
          setStreakError(t("profile_page.errors.streak_unavailable"));
          setScore(0);
          setScoreGoal(null);
        }
      } finally {
        if (mounted) setStreakLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [isOwner, t]);

  useEffect(() => {
    if (!isOwner) return;
    let mounted = true;

    (async () => {
      try {
        const { data } = await axios.get(`${API}/user/get/score/history?days=7`, { headers: authHeaders() });
        if (mounted) setScoreHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error historial de score:", err.response?.data ?? err.message);
        if (mounted) setScoreHistory([]);
      } finally {
        if (mounted) setScoreHistoryLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [isOwner]);

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
          setError(err.response?.status === 404 ? t("profile_page.errors.not_found") : t("profile_page.errors.load_failed"));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [username, t]);

  const togglePanel = (name) => {
    setPanel(prev => prev === name ? null : name);
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    const description = reportDescription.trim();
    if (description.length < 20 || description.length > 2000) {
      setReportError("La descripción debe tener entre 20 y 2000 caracteres.");
      return;
    }
    if (sendingReport || !profileUser?.id) return;

    setSendingReport(true);
    setReportError("");
    try {
      await axios.post(
        `${API}/user/report`,
        { reported_id: profileUser.id, reason: reportReason, description },
        { headers: authHeaders() }
      );
      setPanel(null);
      setReportDescription("");
      toast.success("El reporte se envió para revisión.");
    } catch (requestError) {
      setReportError(getErrorMessage(requestError, "No se pudo enviar el reporte."));
    } finally {
      setSendingReport(false);
    }
    setIsMenuOpen(false);
    setError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGoalSave = async (e) => {
    e.preventDefault();
    const nextGoal = Number(goalInput);

    if (!Number.isInteger(nextGoal) || nextGoal <= 0 || nextGoal > 5000) {
      setGoalError(t("profile_page.errors.goal_invalid"));
      return;
    }

    setGoalLoading(true);
    setGoalError("");
    try {
      const { data } = await axios.patch(
        `${API}/user/update/goal`,
        { score_goal: nextGoal },
        { headers: authHeaders() }
      );
      const normalized = Number(data.score_goal ?? nextGoal);
      setScoreGoal(Number.isFinite(normalized) ? normalized : nextGoal);
      setGoalInput(String(normalized));
      toast.success(t("profile_page.toast.goal_updated"));
    } catch (err) {
      setGoalError(getErrorMessage(err, t("profile_page.errors.goal_update_failed")));
    } finally {
      setGoalLoading(false);
    }
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
      toast.success(t("profile_page.toast.profile_updated"));
      await refreshUser();
      if (payload.username !== username) {
        navigate(`/user/${encodeURIComponent(payload.username)}`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, t("profile_page.errors.profile_save_failed")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <p className={styles.loadingText} role="status">{t("profile_page.loading")}</p>
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
          panel={panel}
          onEditClick={() => togglePanel("edit")}
          onRequestsClick={() => togglePanel("requests")}
          onReportClick={() => {
            setReportError("");
            togglePanel("report");
          }}
        />

        <ProfileStats
          isOwner={isOwner}
          streak={streak}
          streakLoading={streakLoading}
          streakError={streakError}
          score={score}
          courses={coursesInProgress}
          progressVisible={profileUser.progressVisible !== false}
        />

        {isOwner && (
          <DailyScoreActivity
            history={scoreHistory}
            scoreGoal={scoreGoal}
            loading={scoreHistoryLoading}
            goalInput={goalInput}
            goalError={goalError}
            goalLoading={goalLoading}
            onGoalInputChange={setGoalInput}
            onGoalSubmit={handleGoalSave}
          />
        )}

        {/* Modal editar perfil */}
        {isOwner && panel === "edit" && (
          <ProfileModal title={t("profile_page.modal.edit_title")} onClose={() => setPanel(null)}>
            <form className={styles.modalBody} onSubmit={handleProfileSave}>
              <div className={styles.formGrid}>
                <label>{t("profile_page.form.username")}<input name="username" value={form.username} onChange={handleFormChange} required minLength="3" /></label>
                <label>{t("profile_page.form.email")}<input name="email" type="email" value={form.email} onChange={handleFormChange} required /></label>
                <label className={styles.fullField}>{t("profile_page.form.biography")}<textarea name="biography" value={form.biography} onChange={handleFormChange} maxLength="240" rows="3" placeholder={t("profile_page.form.bio_placeholder")} /></label>
                <label className={styles.fullField}>
                  <span className={styles.fieldLabel}>{t("profile_page.form.password")} <small>({t("profile_page.form.optional")})</small></span>
                  <input name="password" type="password" value={form.password} onChange={handleFormChange} minLength="8" />
                </label>
              </div>
              <div className={styles.formActions}>
                {error && <p className={styles.formError}>{error}</p>}
                <button className={styles.saveButton} type="submit" disabled={saving}>{saving ? t("profile_page.form.saving") : t("profile_page.form.save_btn")}</button>
              </div>
            </form>
          </ProfileModal>
        )}

        {/* Modal solicitudes */}
        {isOwner && panel === "requests" && (
          <ProfileModal title={t("profile_page.modal.requests_title")} onClose={() => setPanel(null)}>
            <FriendRequestsPanel />
          </ProfileModal>
        )}

        {!isOwner && panel === "report" && (
          <ProfileModal title="Reportar usuario" onClose={() => setPanel(null)}>
            <form className={styles.modalBody} onSubmit={handleReportSubmit}>
              <p className={styles.reportIntro}>
                El reporte será revisado por el equipo de moderación. Usalo para informar un incidente concreto.
              </p>
              <label className={styles.reportField}>
                Motivo del reporte
                <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
                  <option value="INAPPROPRIATE_CONTENT">Contenido inapropiado</option>
                  <option value="HARASSMENT">Acoso o bullying</option>
                  <option value="THREATS">Amenazas o intimidación</option>
                  <option value="SEXUAL_CONTENT">Desnudos o contenido sexual explícito</option>
                  <option value="GRAPHIC_VIOLENCE">Violencia o contenido gráfico</option>
                  <option value="SPAM">Spam o publicidad no solicitada</option>
                  <option value="IDENTITY_THEFT">Suplantación de identidad</option>
                  <option value="HATE_SPEECH">Discurso de odio o discriminación</option>
                  <option value="FRAUD">Estafa o intento de fraude</option>
                  <option value="ILLEGAL_ACTIVITY">Contenido relacionado con actividades ilegales</option>
                  <option value="MISINFORMATION">Información falsa o engañosa</option>
                  <option value="OTHER">Otro motivo</option>
                </select>
              </label>
              <label className={styles.reportField}>
                Descripción
                <textarea
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                  minLength={20}
                  maxLength={2000}
                  rows={6}
                  required
                  placeholder="Contá brevemente qué ocurrió. Para “Otro motivo”, explicalo acá."
                />
                <span className={styles.characterCount}>{reportDescription.length}/2000</span>
              </label>
              {reportError && <p className={styles.formError} role="alert">{reportError}</p>}
              <div className={styles.formActions}>
                <button className={styles.secondaryAction} type="button" onClick={() => setPanel(null)} disabled={sendingReport}>
                  Cancelar
                </button>
                <button className={styles.saveButton} type="submit" disabled={sendingReport}>
                  {sendingReport ? "Enviando…" : "Enviar reporte"}
                </button>
              </div>
            </form>
          </ProfileModal>
        )}

        {/* Cursos */}
        <section className={styles.contentArea} aria-label={t("profile_page.courses_aria")}>
          <div className={styles.contentHeading}>
            <h2 className={styles.contentTitle}>{t("profile_page.courses_title")}</h2>
            {profileUser.progressVisible && (
              <span className={styles.courseCount}>
                {coursesInProgress.length} {coursesInProgress.length === 1 ? t("profile_page.stats.course_singular") : t("profile_page.stats.course_plural")}
              </span>
            )}
          </div>
          {!profileUser.progressVisible ? (
            <div className={styles.emptyState} role="status">
              <svg className={styles.emptyIcon} viewBox="0 0 36 36" aria-hidden="true">
                <path d="M23 4v17.5a4.5 4.5 0 1 1-2-3.7V8l-11 3v14.5a4.5 4.5 0 1 1-2-3.7V9L23 4Z" fill="currentColor"/>
                <path d="M5 31 31 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <h3>{t("profile_page.private.title")}</h3>
              <p>{t("profile_page.private.desc")}</p>
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
              <h3>{t("profile_page.empty_courses.title")}</h3>
              <p>{isOwner ? t("profile_page.empty_courses.owner_desc") : t("profile_page.empty_courses.other_desc")}</p>
              {isOwner && (
                <button type="button" className={styles.primaryAction} onClick={() => navigate("/courses/catalog")}>
                  {t("profile_page.empty_courses.explore_btn")}
                </button>
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
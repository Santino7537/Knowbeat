import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./CSS/AdminView.module.css";

const TABS = [
  { id: "users", label: "Usuarios" },
  { id: "reports", label: "Reportes" },
  { id: "announcements", label: "Anuncios" }
];

const roleLabel = (role) => ({
  Administrator: "Administrador",
  Moderator: "Moderador",
  User: "Usuario"
}[role] ?? role);

const reportStatusLabel = (status) => ({
  PENDING: "Pendiente",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado"
}[status] ?? status);

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
};

function isAuthorizationError(error) {
  return error.response?.status === 401 || error.response?.status === 403;
}

export default function AdminView() {
  const navigate = useNavigate();
  const { loggedUser, adminAuthorization, clearAdminAuthorization } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const loadData = useCallback(async () => {
    if (!adminAuthorization) return;
    setLoading(true);
    setError("");

    const config = {
      headers: { "X-Admin-Authorization": adminAuthorization.token }
    };

    try {
      const [usersResponse, reportsResponse] = await Promise.all([
        api.get("/user/get/users", config),
        api.get("/admin/reports?status=PENDING&limit=50", config)
      ]);
      const userPayload = usersResponse.data;
      const reportPayload = reportsResponse.data?.data;

      if (!Array.isArray(userPayload?.users) || !Array.isArray(userPayload?.roles)
        || !Array.isArray(reportPayload?.reports)) {
        throw new Error("La respuesta del panel administrativo no tiene un formato válido.");
      }

      setUsers(userPayload.users);
      setRoles(userPayload.roles);
      setReports(reportPayload.reports);
      setReportTotal(Number(reportPayload.pagination?.total) || 0);
    } catch (requestError) {
      if (isAuthorizationError(requestError)) clearAdminAuthorization();
      setError(getErrorMessage(requestError, "No se pudo cargar el panel administrativo."));
    } finally {
      setLoading(false);
    }
  }, [adminAuthorization, clearAdminAuthorization]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es");
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role_id === Number(roleFilter);
      const matchesSearch = !normalizedSearch
        || `${user.username} ${user.email}`.toLocaleLowerCase("es").includes(normalizedSearch);
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const administratorCount = users.filter((user) => user.role_name === "Administrator").length;
  const moderatorCount = users.filter((user) => user.role_name === "Moderator").length;

  const goBack = () => {
    if (Number.isInteger(window.history.state?.idx) && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/courses", { replace: true });
    }
  };

  const handleAdminError = (requestError, fallback) => {
    if (isAuthorizationError(requestError)) clearAdminAuthorization();
    setActionError(getErrorMessage(requestError, fallback));
  };

  const handleRoleChange = async (user, roleId) => {
    setActionError("");
    setBusyAction(`role:${user.id}`);
    try {
      await api.patch(
        `/user/update/role/${user.id}`,
        { rol: Number(roleId) },
        { headers: { "X-Admin-Authorization": adminAuthorization.token } }
      );
      await loadData();
    } catch (requestError) {
      handleAdminError(requestError, "No se pudo actualizar el rol.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionError("");
    setBusyAction(`delete:${selectedUser.id}`);
    try {
      await api.patch(
        `/user/delete/user/${selectedUser.id}`,
        {},
        { headers: { "X-Admin-Authorization": adminAuthorization.token } }
      );
      setSelectedUser(null);
      await loadData();
    } catch (requestError) {
      handleAdminError(requestError, "No se pudo eliminar el usuario.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleResolveReport = async (reportId, status) => {
    setActionError("");
    setBusyAction(`report:${reportId}`);
    try {
      await api.patch(
        `/admin/reports/${reportId}`,
        { status },
        { headers: { "X-Admin-Authorization": adminAuthorization.token } }
      );
      await loadData();
    } catch (requestError) {
      handleAdminError(requestError, "No se pudo resolver el reporte.");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.adminPage}>
          <div className={styles.loadingState} role="status">
            <span className={styles.loader} aria-hidden="true" />
            <p>Verificando y cargando el panel…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.adminPage}>
          <section className={styles.errorState} role="alert">
            <h1>No se pudo abrir Administración</h1>
            <p>{error}</p>
            <div className={styles.errorActions}>
              <button type="button" className={styles.secondaryButton} onClick={goBack}>Volver</button>
              <button type="button" className={styles.primaryButton} onClick={loadData}>Reintentar</button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.adminPage}>
        <header className={styles.pageHeader}>
          <div>
            <button type="button" className={styles.backButton} onClick={goBack}>
              <span aria-hidden="true">←</span> Volver
            </button>
            <p className={styles.eyebrow}>KnowBeat · Gestión</p>
            <h1>Administración</h1>
            <p className={styles.pageDescription}>
              Gestión de usuarios y moderación de la comunidad.
            </p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.adminBadge}>Administrador</span>
            <button type="button" className={styles.refreshButton} onClick={loadData}>
              Actualizar datos
            </button>
          </div>
        </header>

        <section className={styles.statsGrid} aria-label="Resumen">
          <article className={styles.statCard}>
            <span>Usuarios activos</span>
            <strong>{users.length}</strong>
            <small>Cuentas no eliminadas</small>
          </article>
          <article className={styles.statCard}>
            <span>Administradores</span>
            <strong>{administratorCount}</strong>
            <small>Con rol administrativo</small>
          </article>
          <article className={styles.statCard}>
            <span>Moderadores</span>
            <strong>{moderatorCount}</strong>
            <small>Con rol de moderación</small>
          </article>
          <article className={styles.statCard}>
            <span>Reportes pendientes</span>
            <strong>{reportTotal}</strong>
            <small>En cola de revisión</small>
          </article>
        </section>

        <nav className={styles.tabs} aria-label="Secciones de administración">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setActionError("");
              }}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
              {tab.id === "reports" && reportTotal > 0 && (
                <span className={styles.tabCount}>{reportTotal}</span>
              )}
            </button>
          ))}
        </nav>

        {actionError && <p className={styles.actionError} role="alert">{actionError}</p>}

        {activeTab === "users" && (
          <section className={styles.section} aria-labelledby="users-heading">
            <div className={styles.sectionHeader}>
              <div>
                <h2 id="users-heading">Usuarios</h2>
                <p>Consultá cuentas y administrá roles y acceso.</p>
              </div>
              <span className={styles.resultCount}>{filteredUsers.length} resultados</span>
            </div>

            <div className={styles.filters}>
              <label className={styles.searchField}>
                <span className={styles.visuallyHidden}>Buscar usuario</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre o email"
                />
              </label>
              <label className={styles.filterField}>
                <span>Rol</span>
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="all">Todos los roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{roleLabel(role.name)}</option>
                  ))}
                </select>
              </label>
            </div>

            {filteredUsers.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No hay usuarios para mostrar</h3>
                <p>Probá con otro nombre, email o filtro de rol.</p>
              </div>
            ) : (
              <div className={styles.userList}>
                {filteredUsers.map((user) => {
                  const isAdministrator = user.role_name === "Administrator";
                  const isCurrentUser = Number(loggedUser?.id) === Number(user.id);
                  return (
                    <article className={styles.userRow} key={user.id}>
                      <div className={styles.userIdentity}>
                        <span className={styles.avatar} aria-hidden="true">
                          {user.username?.[0]?.toLocaleUpperCase("es") ?? "?"}
                        </span>
                        <div className={styles.userDetails}>
                          <strong>{user.username}</strong>
                          <span>{user.email}</span>
                        </div>
                        <span className={`${styles.roleBadge} ${isAdministrator ? styles.adminRole : user.role_name === "Moderator" ? styles.moderatorRole : ""}`}>
                          {roleLabel(user.role_name)}
                        </span>
                        {isCurrentUser && <span className={styles.currentUserBadge}>Tu cuenta</span>}
                      </div>
                      <div className={styles.userActions}>
                        <label className={styles.visuallyHidden} htmlFor={`role-${user.id}`}>Rol de {user.username}</label>
                        <select
                          id={`role-${user.id}`}
                          className={styles.roleSelect}
                          value={user.role_id}
                          disabled={isAdministrator || busyAction === `role:${user.id}`}
                          onChange={(event) => handleRoleChange(user, event.target.value)}
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>{roleLabel(role.name)}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          disabled={isAdministrator || isCurrentUser || busyAction === `delete:${user.id}`}
                          onClick={() => setSelectedUser(user)}
                          title={isAdministrator ? "No se puede eliminar una cuenta administradora" : undefined}
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === "reports" && (
          <section className={styles.section} aria-labelledby="reports-heading">
            <div className={styles.sectionHeader}>
              <div>
                <h2 id="reports-heading">Reportes pendientes</h2>
                <p>Revisá el contenido informado por la comunidad.</p>
              </div>
              <span className={styles.resultCount}>{reports.length} de {reportTotal}</span>
            </div>
            {reports.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No hay reportes pendientes</h3>
                <p>Los nuevos reportes aparecerán en esta sección.</p>
              </div>
            ) : (
              <div className={styles.reportList}>
                {reports.map((report) => (
                  <article className={styles.reportCard} key={report.id}>
                    <div className={styles.reportHeader}>
                      <div>
                        <span className={styles.pendingBadge}>{reportStatusLabel(report.status)}</span>
                        <h3>{roleLabel(report.reason)}</h3>
                      </div>
                      <time dateTime={report.date}>{formatDate(report.date)}</time>
                    </div>
                    <p className={styles.reportDescription}>{report.description}</p>
                    <div className={styles.reportMeta}>
                      <span>Reportado: <strong>{report.reported?.username ?? "Usuario no disponible"}</strong></span>
                      <span>Por: {report.reporter?.username ?? "Usuario no disponible"}</span>
                    </div>
                    <div className={styles.reportActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        disabled={busyAction === `report:${report.id}`}
                        onClick={() => handleResolveReport(report.id, "REJECTED")}
                      >
                        Descartar reporte
                      </button>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={busyAction === `report:${report.id}`}
                        onClick={() => handleResolveReport(report.id, "ACCEPTED")}
                      >
                        Aceptar reporte
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "announcements" && (
          <section className={styles.section} aria-labelledby="announcements-heading">
            <div className={styles.sectionHeader}>
              <div>
                <h2 id="announcements-heading">Anuncios</h2>
                <p>Publicaciones para toda la comunidad.</p>
              </div>
            </div>
            <div className={styles.unavailableNotice} role="status">
              <strong>Publicación de anuncios no disponible</strong>
              <p>Esta sección todavía no cuenta con un endpoint de publicación en el backend. No se enviará ni guardará ningún anuncio.</p>
            </div>
          </section>
        )}
      </main>

      {selectedUser && (
        <div className={styles.modalOverlay} onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busyAction) setSelectedUser(null);
        }}>
          <section className={styles.deleteModal} role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <p className={styles.eyebrow}>Acción irreversible</p>
            <h2 id="delete-title">Eliminar usuario</h2>
            <p>
              Se marcará la cuenta de <strong>{selectedUser.username}</strong> como eliminada y perderá el acceso al sistema.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setSelectedUser(null)}
                disabled={Boolean(busyAction)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDeleteUser}
                disabled={Boolean(busyAction)}
              >
                {busyAction ? "Procesando…" : "Confirmar eliminación"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

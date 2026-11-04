import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./CSS/AdminView.module.css";

const TABS = [
  { id: "users", label: "Usuarios" },
  { id: "reports", label: "Reportes" }
];

const roleLabel = (role) => ({
  Administrator: "Administrador",
  Moderator: "Moderador",
  User: "Usuario"
}[role] ?? role);

const reportStatusLabel = (status) => ({
  PENDING: "Pendiente",
  RESOLVED: "Resuelto",
  ACCEPTED: "Revisado",
  REJECTED: "Rechazado"
}[status] ?? status);

const reportReasonLabel = (reason) => ({
  INAPPROPRIATE_CONTENT: "Contenido inapropiado",
  HARASSMENT: "Acoso o bullying",
  THREATS: "Amenazas o intimidación",
  SEXUAL_CONTENT: "Contenido sexual explícito",
  GRAPHIC_VIOLENCE: "Violencia o contenido gráfico",
  SPAM: "Spam o publicidad no solicitada",
  IDENTITY_THEFT: "Suplantación de identidad",
  HATE_SPEECH: "Discurso de odio o discriminación",
  FRAUD: "Estafa o intento de fraude",
  ILLEGAL_ACTIVITY: "Actividades ilegales",
  MISINFORMATION: "Información falsa o engañosa",
  OFFENSIVE_LANGUAGE: "Lenguaje ofensivo (anterior)",
  PERSONAL_DATA_EXPOSURE: "Exposición de datos personales (anterior)",
  OTHER: "Otro motivo"
}[reason] ?? reason);

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : date.toLocaleString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
  const [pendingReportCount, setPendingReportCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [reportStatusFilter, setReportStatusFilter] = useState("PENDING");
  const [reportReasonFilter, setReportReasonFilter] = useState("all");
  const [reportSearch, setReportSearch] = useState("");
  const [reportPage, setReportPage] = useState(1);
  const [reportAction, setReportAction] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [sanctionType, setSanctionType] = useState("temporary");
  const [sanctionDuration, setSanctionDuration] = useState("7");
  const [sanctionEndDate, setSanctionEndDate] = useState("");
  const [busyAction, setBusyAction] = useState(null);
  const hasLoadedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!adminAuthorization) return;
    if (!hasLoadedRef.current) setLoading(true);
    setError("");

    const config = {
      headers: { "X-Admin-Authorization": adminAuthorization.token }
    };
    const reportParams = new URLSearchParams({ page: String(reportPage), limit: "10" });
    if (reportStatusFilter !== "all") reportParams.set("status", reportStatusFilter);
    if (reportReasonFilter !== "all") reportParams.set("reason", reportReasonFilter);
    if (reportSearch.trim()) reportParams.set("search", reportSearch.trim());

    try {
      const [usersResponse, reportsResponse, pendingResponse] = await Promise.all([
        api.get("/user/get/users", config),
        api.get(`/admin/reports?${reportParams.toString()}`, config),
        api.get("/admin/reports?status=PENDING&limit=1&page=1", config)
      ]);
      const userPayload = usersResponse.data;
      const reportPayload = reportsResponse.data?.data;
      const pendingPayload = pendingResponse.data?.data;

      if (!Array.isArray(userPayload?.users) || !Array.isArray(userPayload?.roles)
        || !Array.isArray(reportPayload?.reports) || !Array.isArray(pendingPayload?.reports)) {
        throw new Error("La respuesta del panel administrativo no tiene un formato válido.");
      }

      setUsers(userPayload.users);
      setRoles(userPayload.roles);
      setReports(reportPayload.reports);
      setReportTotal(Number(reportPayload.pagination?.total) || 0);
      setPendingReportCount(Number(pendingPayload.pagination?.total) || 0);
    } catch (requestError) {
      if (isAuthorizationError(requestError)) clearAdminAuthorization();
      setError(getErrorMessage(requestError, "No se pudo cargar el panel administrativo."));
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [
    adminAuthorization,
    clearAdminAuthorization,
    reportPage,
    reportReasonFilter,
    reportSearch,
    reportStatusFilter
  ]);

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
  const customDateMin = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const customDateMax = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

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

  const openReportDetails = async (reportId) => {
    setActionError("");
    setBusyAction(`report-detail:${reportId}`);
    try {
      const { data } = await api.get(
        `/admin/reports/${reportId}`,
        { headers: { "X-Admin-Authorization": adminAuthorization.token } }
      );
      if (!data.data?.report) throw new Error("El detalle del reporte no tiene un formato válido.");
      setSelectedReport(data.data.report);
      setReportDetail(data.data.report);
      setReportAction(null);
      setAdminComment("");
    } catch (requestError) {
      handleAdminError(requestError, "No se pudo cargar el detalle del reporte.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleResolveReport = async () => {
    if (!selectedReport || !reportAction) return;
    const isPermanent = reportAction === "sanction" && sanctionType === "permanent";
    const confirmMessage = reportAction === "reject"
      ? "¿Confirmás el rechazo definitivo de este reporte?"
      : "¿Confirmás aplicar esta sanción al usuario reportado?";
    if (!window.confirm(confirmMessage)) return;
    if (isPermanent && !window.confirm("La suspensión será permanente. ¿Confirmás esta acción?")) return;

    setActionError("");
    setBusyAction(`report:${selectedReport.id}`);
    try {
      await api.patch(
        `/admin/reports/${selectedReport.id}`,
        reportAction === "reject"
          ? { action: "reject", admin_comment: adminComment }
          : {
            action: "sanction",
            admin_comment: adminComment,
            sanction: sanctionType === "permanent"
              ? { type: "permanent" }
              : sanctionDuration === "custom"
                ? { type: "temporary", endDate: sanctionEndDate }
                : { type: "temporary", durationDays: Number(sanctionDuration) }
          },
        { headers: { "X-Admin-Authorization": adminAuthorization.token } }
      );
      setSelectedReport(null);
      setReportDetail(null);
      setReportAction(null);
      await loadData();
    } catch (requestError) {
      handleAdminError(requestError, "No se pudo resolver el reporte.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRevokeSanction = async (user) => {
    if (!window.confirm(`¿Revocar la suspensión de ${user.username}?`)) return;
    setActionError("");
    setBusyAction(`revoke:${user.id}`);
    try {
      await api.patch(
        `/admin/sanctions/user/${user.id}/revoke`,
        {},
        { headers: { "X-Admin-Authorization": adminAuthorization.token } }
      );
      await loadData();
    } catch (requestError) {
      handleAdminError(requestError, "No se pudo revocar la sanción.");
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
            <strong>{pendingReportCount}</strong>
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
                  const isPermanentlyBanned = Number(user.is_permanently_banned) === 1;
                  const hasActiveSanction = isPermanentlyBanned || Boolean(user.sanction_expires_at);
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
                        {isPermanentlyBanned && (
                          <span className={styles.suspendedBadge}>Suspensión permanente</span>
                        )}
                        {!isPermanentlyBanned && user.sanction_expires_at && (
                          <span className={styles.suspendedBadge}>
                            Suspendido hasta {formatDate(user.sanction_expires_at)}
                          </span>
                        )}
                        {isCurrentUser && <span className={styles.currentUserBadge}>Tu cuenta</span>}
                      </div>
                      <div className={styles.userActions}>
                        {hasActiveSanction && (
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            disabled={busyAction === `revoke:${user.id}`}
                            onClick={() => handleRevokeSanction(user)}
                          >
                            {busyAction === `revoke:${user.id}` ? "Revocando…" : "Revocar suspensión"}
                          </button>
                        )}
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
                <h2 id="reports-heading">Reportes</h2>
                <p>Revisá el contenido informado por la comunidad.</p>
              </div>
              <span className={styles.resultCount}>{reports.length} de {reportTotal}</span>
            </div>
            <div className={styles.filters}>
              <label className={styles.searchField}>
                <span className={styles.visuallyHidden}>Buscar denunciante o usuario reportado</span>
                <input
                  type="search"
                  value={reportSearch}
                  maxLength={80}
                  onChange={(event) => {
                    setReportSearch(event.target.value);
                    setReportPage(1);
                  }}
                  placeholder="Buscar por nombre de usuario"
                />
              </label>
              <label className={styles.filterField}>
                <span>Estado</span>
                <select
                  value={reportStatusFilter}
                  onChange={(event) => {
                    setReportStatusFilter(event.target.value);
                    setReportPage(1);
                  }}
                >
                  <option value="PENDING">Pendientes</option>
                  <option value="RESOLVED">Resueltos</option>
                  <option value="REJECTED">Rechazados</option>
                  <option value="ACCEPTED">Revisados anteriormente</option>
                  <option value="all">Todos</option>
                </select>
              </label>
              <label className={styles.filterField}>
                <span>Motivo</span>
                <select
                  value={reportReasonFilter}
                  onChange={(event) => {
                    setReportReasonFilter(event.target.value);
                    setReportPage(1);
                  }}
                >
                  <option value="all">Todos los motivos</option>
                  {[
                    "INAPPROPRIATE_CONTENT", "HARASSMENT", "THREATS", "SEXUAL_CONTENT",
                    "GRAPHIC_VIOLENCE", "SPAM", "IDENTITY_THEFT", "HATE_SPEECH",
                    "FRAUD", "ILLEGAL_ACTIVITY", "MISINFORMATION", "OTHER",
                    "OFFENSIVE_LANGUAGE", "PERSONAL_DATA_EXPOSURE"
                  ].map((reason) => (
                    <option key={reason} value={reason}>{reportReasonLabel(reason)}</option>
                  ))}
                </select>
              </label>
            </div>
            {reports.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No hay reportes para mostrar</h3>
                <p>Probá con otros filtros o una búsqueda diferente.</p>
              </div>
            ) : (
              <div className={styles.reportList}>
                {reports.map((report) => (
                  <article className={styles.reportCard} key={report.id}>
                    <div className={styles.reportHeader}>
                      <div>
                        <span className={`${styles.pendingBadge} ${report.status === "RESOLVED" ? styles.resolvedBadge : report.status === "REJECTED" ? styles.rejectedBadge : ""}`}>
                          {reportStatusLabel(report.status)}
                        </span>
                        <h3>#{report.id} · {reportReasonLabel(report.reason)}</h3>
                      </div>
                      <time dateTime={report.date}>{formatDate(report.date)}</time>
                    </div>
                    <div className={styles.reportMeta}>
                      <span>Reportado: <strong>{report.reported?.username ?? "Usuario no disponible"}</strong></span>
                      <span>Por: {report.reporter?.username ?? "Usuario no disponible"}</span>
                    </div>
                    <div className={styles.reportActions}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={busyAction === `report-detail:${report.id}`}
                        onClick={() => openReportDetails(report.id)}
                      >
                        {busyAction === `report-detail:${report.id}` ? "Cargando…" : "Ver detalle"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {reportTotal > 10 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={reportPage <= 1}
                  onClick={() => setReportPage((page) => page - 1)}
                >
                  Anterior
                </button>
                <span>Página {reportPage} de {Math.ceil(reportTotal / 10)}</span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={reportPage >= Math.ceil(reportTotal / 10)}
                  onClick={() => setReportPage((page) => page + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </section>
        )}

      </main>

      {selectedReport && reportDetail && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyAction) {
              setSelectedReport(null);
              setReportDetail(null);
              setReportAction(null);
            }
          }}
        >
          <section className={styles.reportDetailModal} role="dialog" aria-modal="true" aria-labelledby="report-detail-title">
            <header className={styles.reportDetailHeader}>
              <div>
                <p className={styles.eyebrow}>Reporte #{reportDetail.id}</p>
                <h2 id="report-detail-title">{reportReasonLabel(reportDetail.reason)}</h2>
              </div>
              <button
                type="button"
                className={styles.closeModalButton}
                aria-label="Cerrar detalle"
                onClick={() => {
                  setSelectedReport(null);
                  setReportDetail(null);
                  setReportAction(null);
                }}
              >
                ×
              </button>
            </header>
            <div className={styles.reportDetailBody}>
              <div className={styles.reportDetailMeta}>
                <span>Estado: <strong>{reportStatusLabel(reportDetail.status)}</strong></span>
                <span>Creado: <strong>{formatDate(reportDetail.date)}</strong></span>
                <span>Denunciante: <button type="button" className={styles.inlineLink} onClick={() => navigate(`/user/${encodeURIComponent(reportDetail.reporter.username)}`)}>{reportDetail.reporter.username}</button></span>
                <span>Usuario reportado: <button type="button" className={styles.inlineLink} onClick={() => navigate(`/user/${encodeURIComponent(reportDetail.reported.username)}`)}>{reportDetail.reported.username}</button></span>
                {reportDetail.reviser && <span>Revisó: <strong>{reportDetail.reviser.username}</strong></span>}
                {reportDetail.review_date && <span>Fecha de revisión: <strong>{formatDate(reportDetail.review_date)}</strong></span>}
              </div>
              <section className={styles.reportDetailDescription}>
                <h3>Descripción</h3>
                <p>{reportDetail.description}</p>
              </section>
              {reportDetail.admin_comment && (
                <section className={styles.reportDetailDescription}>
                  <h3>Comentario de moderación</h3>
                  <p>{reportDetail.admin_comment}</p>
                </section>
              )}
              {reportDetail.status === "PENDING" && !reportAction && (
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setReportAction("reject");
                      setAdminComment("");
                    }}
                  >
                    Rechazar reporte
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => {
                      setReportAction("sanction");
                      setAdminComment("");
                      setSanctionType("temporary");
                      setSanctionEndDate("");
                    }}
                  >
                    Aplicar sanción
                  </button>
                </div>
              )}
              {reportAction && (
                <form
                  className={styles.resolutionForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleResolveReport();
                  }}
                >
                  <h3>{reportAction === "reject" ? "Rechazar reporte" : "Aplicar sanción"}</h3>
                  {reportAction === "sanction" && (
                    <>
                      <label className={styles.adminField}>
                        Tipo de sanción
                        <select value={sanctionType} onChange={(event) => setSanctionType(event.target.value)}>
                          <option value="temporary">Suspensión temporal</option>
                          <option value="permanent">Suspensión permanente</option>
                        </select>
                      </label>
                      {sanctionType === "temporary" ? (
                        <>
                          <label className={styles.adminField}>
                            Duración
                            <select
                              value={sanctionDuration}
                              onChange={(event) => {
                                if (event.target.value === "custom") {
                                  setSanctionDuration("custom");
                                } else {
                                  setSanctionDuration(event.target.value);
                                  setSanctionEndDate("");
                                }
                              }}
                            >
                              {[1, 3, 7, 15, 30, 60, 90].map((days) => (
                                <option key={days} value={days}>{days} {days === 1 ? "día" : "días"}</option>
                              ))}
                              <option value="custom">Elegir fecha de finalización</option>
                            </select>
                          </label>
                          {sanctionDuration === "custom" && (
                            <label className={styles.adminField}>
                              Fecha de finalización
                              <input
                                type="date"
                                value={sanctionEndDate}
                                min={customDateMin}
                                max={customDateMax}
                                onChange={(event) => setSanctionEndDate(event.target.value)}
                                required
                              />
                            </label>
                          )}
                        </>
                      ) : (
                        <p className={styles.permanentWarning}>
                          La cuenta no podrá iniciar sesión hasta que un administrador revoque esta sanción.
                        </p>
                      )}
                      {sanctionType === "temporary" && (
                        <p className={styles.sanctionPreview}>
                          Se aplicará al confirmar. Finalización estimada:{" "}
                          {sanctionDuration === "custom"
                            ? sanctionEndDate
                              ? formatDate(`${sanctionEndDate}T23:59:59.000Z`)
                              : "elegí una fecha"
                            : formatDate(new Date(Date.now() + Number(sanctionDuration) * 86400000).toISOString())}
                          {sanctionDuration !== "custom" && ` · ${sanctionDuration} días`}
                        </p>
                      )}
                    </>
                  )}
                  <label className={styles.adminField}>
                    {reportAction === "reject" ? "Justificación del rechazo" : "Motivo que verá el usuario"}
                    <textarea
                      value={adminComment}
                      onChange={(event) => setAdminComment(event.target.value)}
                      minLength={10}
                      maxLength={1000}
                      rows={4}
                      required
                    />
                    <span className={styles.characterCount}>{adminComment.length}/1000</span>
                  </label>
                  {actionError && <p className={styles.actionError} role="alert">{actionError}</p>}
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={Boolean(busyAction)}
                      onClick={() => {
                        setReportAction(null);
                        setAdminComment("");
                        setActionError("");
                      }}
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      className={reportAction === "sanction" ? styles.deleteButton : styles.primaryButton}
                      disabled={Boolean(busyAction) || adminComment.trim().length < 10
                        || (reportAction === "sanction" && sanctionType === "temporary"
                          && sanctionDuration === "custom" && !sanctionEndDate)}
                    >
                      {busyAction ? "Procesando…" : reportAction === "reject" ? "Confirmar rechazo" : "Confirmar sanción"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      )}

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

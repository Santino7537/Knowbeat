import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../api/client";
import Sidebar from "../components/Sidebar.jsx";
import styles from "./CSS/AdminAccess.module.css";

export default function AdminAccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyAdminPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    if (Number.isInteger(window.history.state?.idx) && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/courses", { replace: true });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await verifyAdminPassword(password);
      setPassword("");
      navigate("/admin", { replace: true, state: { from: location.state?.from } });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo verificar el acceso administrativo."));
    } finally {
      setPassword("");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          <span aria-hidden="true">←</span> Volver
        </button>
        <section className={styles.card} aria-labelledby="admin-access-title">
          <div className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6L12 3Z" />
              <path d="M9 12.2 11 14l4-4" />
            </svg>
          </div>
          <p className={styles.eyebrow}>Verificación de identidad</p>
          <h1 id="admin-access-title">Confirmá que sos vos</h1>
          <p className={styles.description}>
            Ingresá nuevamente tu contraseña para habilitar el acceso administrativo durante 10 minutos.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="admin-password">Contraseña actual</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              maxLength={128}
              autoFocus
            />
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={handleBack}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitButton} disabled={submitting || !password}>
                {submitting ? "Verificando..." : "Continuar"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

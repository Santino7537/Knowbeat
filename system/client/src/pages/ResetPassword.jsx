import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import AuthField from "../components/login-register/AuthField.jsx";
import styles from "./CSS/ResetPassword.module.css";

export default function ResetPassword() {
  const location = useLocation();
  const token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8 || password.length > 128) {
      setError("La contraseña debe tener entre 8 y 128 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const { data } = await api.post("/user/password/reset", { token, password });
      setSuccess(data.message);
      setPassword("");
      setConfirmation("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "No se pudo cambiar la contraseña. Probá de nuevo."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="reset-password-title">
        <p className={styles.eyebrow}>Seguridad de la cuenta</p>
        <h1 id="reset-password-title">Elegí una nueva contraseña</h1>
        <p className={styles.description}>El enlace es de un solo uso y vence a los 30 minutos.</p>

        {!token ? (
          <p className={styles.error} role="alert">El enlace de recuperación no es válido o venció.</p>
        ) : success ? (
          <>
            <p className={styles.success} role="status">{success}</p>
            <Link className={styles.button} to="/Login">Ir a iniciar sesión</Link>
          </>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <AuthField
              id="reset-password" label="Nueva contraseña" type="password" icon="lock"
              value={password} autoComplete="new-password" placeholder="Mínimo 8 caracteres"
              onChange={(event) => { setPassword(event.target.value); setError(""); }}
            />
            <AuthField
              id="reset-password-confirmation" label="Repetí la contraseña" type="password" icon="lock"
              value={confirmation} autoComplete="new-password" placeholder="Volvé a escribirla"
              onChange={(event) => { setConfirmation(event.target.value); setError(""); }}
            />
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>
        )}

        {!success && <Link className={styles.backLink} to="/Login">Volver al inicio de sesión</Link>}
      </section>
    </main>
  );
}

import { useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import AuthField from './AuthField.jsx';
import styles from './form_card.module.css';

function Login_card({ onAuthSuccess, onAccountSuspended, switchToRegister }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [loading, setLoading] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    const clear = (field) => {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setGeneralError("");
        setRequestSent(false);
    };

    function validateForm() {
        const next = {};
        if (!username.trim()) next.username = "Ingresá tu nombre de usuario.";
        if (!password) next.password = "Ingresá tu contraseña.";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function fetchLogin(event) {
        event.preventDefault();
        setGeneralError("");
        if (loading) return;

        if (forgotPassword) {
            const next = {};
            if (!username.trim()) next.username = "Ingresá tu nombre de usuario.";
            setErrors(next);
            if (Object.keys(next).length > 0) return;

            setLoading(true);
            try {
                const { data } = await api.post("/user/password/forgot", { username: username.trim() });
                setRequestSent(true);
                setGeneralError(data.message);
            } catch (err) {
                setGeneralError(getErrorMessage(err, "No pudimos enviar el correo de recuperación. Probá de nuevo."));
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!validateForm()) return;

        setLoading(true);
        try {
            const { data } = await api.post("/login", { username: username.trim(), password });
            await onAuthSuccess(data.token);
        } catch (err) {
            if (err.response?.data?.code === "ACCOUNT_SUSPENDED") {
                onAccountSuspended?.(err.response.data.suspension);
                return;
            }
            const status = err.response?.status;
            if (status === 400 || status === 401) {
                // Credenciales incorrectas: marcamos ambos campos (no revelamos cuál falló)
                setErrors({ username: " ", password: " " });
                setGeneralError("El usuario o la contraseña no son correctos. Revisalos e intentá de nuevo.");
            } else {
                setGeneralError(getErrorMessage(err, "No pudimos iniciar sesión. Probá de nuevo."));
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className={styles.form} onSubmit={fetchLogin} noValidate>
            <div className={styles.formHead}>
                <h2>{forgotPassword ? "Recuperá tu contraseña" : "¡Hola de nuevo! 👋"}</h2>
                <p>{forgotPassword
                    ? "Ingresá tu nombre de usuario y te enviaremos un enlace a tu correo."
                    : "Entrá para seguir practicando donde lo dejaste."}</p>
            </div>

            <AuthField
                id="login-username" label="Nombre de usuario" icon="user"
                value={username} autoComplete="username" placeholder="tu_usuario"
                onChange={(e) => { setUsername(e.target.value); clear("username"); }}
                error={errors.username}
            />
            {!forgotPassword && (
                <AuthField
                    id="login-password" label="Contraseña" type="password" icon="lock"
                    value={password} autoComplete="current-password" placeholder="••••••••"
                    onChange={(e) => { setPassword(e.target.value); clear("password"); }}
                    error={errors.password}
                />
            )}

            {!forgotPassword && (
                <div className={styles.forgot_password}>
                    <button
                        type="button"
                        onClick={() => {
                            setForgotPassword(true);
                            setGeneralError("");
                            setErrors({});
                        }}
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>
            )}

            {generalError && (
                <div className={requestSent ? styles.successAlert : styles.alert} role={requestSent ? "status" : "alert"}>
                    {generalError}
                </div>
            )}

            {!requestSent && <button type="submit" className={styles.button} disabled={loading}>
                {loading && <span className={styles.spinner} aria-hidden="true" />}
                {loading ? (forgotPassword ? "Enviando…" : "Entrando…") : (forgotPassword ? "Enviar enlace" : "Iniciar sesión")}
            </button>}

            {forgotPassword ? (
                <p className={styles.switchText}>
                    <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => {
                            setForgotPassword(false);
                            setRequestSent(false);
                            setGeneralError("");
                            setErrors({});
                        }}
                    >
                        Volver al inicio de sesión
                    </button>
                </p>
            ) : (
                <p className={styles.switchText}>
                    ¿No tenés cuenta?{" "}
                    <button type="button" className={styles.linkButton} onClick={switchToRegister}>Creá una gratis</button>
                </p>
            )}
        </form>
    );
}

export default Login_card;

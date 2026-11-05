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

    const clear = (field) => {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setGeneralError("");
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
        if (!validateForm() || loading) return;

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
                <h2>¡Hola de nuevo! 👋</h2>
                <p>Entrá para seguir practicando donde lo dejaste.</p>
            </div>

            <AuthField
                id="login-username" label="Nombre de usuario" icon="user"
                value={username} autoComplete="username" placeholder="tu_usuario"
                onChange={(e) => { setUsername(e.target.value); clear("username"); }}
                error={errors.username}
            />
            <AuthField
                id="login-password" label="Contraseña" type="password" icon="lock"
                value={password} autoComplete="current-password" placeholder="••••••••"
                onChange={(e) => { setPassword(e.target.value); clear("password"); }}
                error={errors.password}
            />

            <div className={styles.forgot_password}>
                <a href="#" onClick={(e) => e.preventDefault()}>¿Olvidaste tu contraseña?</a>
            </div>

            {generalError && <div className={styles.alert} role="alert">{generalError}</div>}

            <button type="submit" className={styles.button} disabled={loading}>
                {loading && <span className={styles.spinner} aria-hidden="true" />}
                {loading ? "Entrando…" : "Iniciar sesión"}
            </button>

            <p className={styles.switchText}>
                ¿No tenés cuenta?{" "}
                <button type="button" className={styles.linkButton} onClick={switchToRegister}>Creá una gratis</button>
            </p>
        </form>
    );
}

export default Login_card;

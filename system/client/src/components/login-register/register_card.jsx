import { useState } from 'react';
import api, { getErrorField, getErrorMessage } from '../../api/client';
import AuthField from './AuthField.jsx';
import styles from './form_card.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Reglas de contraseña que se muestran como checklist
const RULES = [
    { id: "len", label: "8 caracteres o más", test: (p) => p.length >= 8 },
    { id: "upper", label: "Una mayúscula", test: (p) => /[A-Z]/.test(p) },
    { id: "num", label: "Un número", test: (p) => /[0-9]/.test(p) },
    { id: "sym", label: "Un símbolo", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH = [
    { label: "", tone: "none" },
    { label: "Muy débil", tone: "weak" },
    { label: "Débil", tone: "weak" },
    { label: "Aceptable", tone: "ok" },
    { label: "Fuerte", tone: "good" },
    { label: "Muy fuerte", tone: "great" },
];

function Register_card({ onAuthSuccess, switchToLogin }) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [loading, setLoading] = useState(false);

    const clear = (field) => {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setGeneralError("");
    };

    const passed = RULES.filter((r) => r.test(password)).length;
    const score = password ? passed + 1 : 0;
    const strength = STRENGTH[score];

    function validateForm() {
        const next = {};
        if (!email.trim()) next.email = "Ingresá tu correo electrónico.";
        else if (!EMAIL_RE.test(email.trim())) next.email = "Ese correo no parece válido (ejemplo: nombre@mail.com).";
        if (!username.trim()) next.username = "Elegí un nombre de usuario.";
        else if (username.trim().length < 3) next.username = "El nombre de usuario debe tener al menos 3 caracteres.";
        else if (/\s/.test(username.trim())) next.username = "El nombre de usuario no puede tener espacios.";
        if (!password) next.password = "Creá una contraseña.";
        else if (password.length < 8) next.password = "La contraseña debe tener al menos 8 caracteres.";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function fetchRegister(event) {
        event.preventDefault();
        setGeneralError("");
        if (!validateForm() || loading) return;

        setLoading(true);
        try {
            const { data } = await api.post("/register", {
                password,
                username: username.trim(),
                email: email.trim(),
            });
            await onAuthSuccess(data.token);
        } catch (err) {
            const status = err.response?.status;
            const message = getErrorMessage(err, "No pudimos crear tu cuenta. Probá de nuevo.");

            if (status === 409) {
                // El backend usa 409 tanto para usuario como para email repetidos:
                // miramos el mensaje para marcar el campo correcto.
                const field = getErrorField(err);
                if (field === "username") {
                    setErrors({ username: "Ese nombre de usuario ya está en uso. Probá con otro." });
                } else if (field === "email") {
                    setErrors({ email: "Ya existe una cuenta con ese correo. ¿Querés iniciar sesión?" });
                } else {
                    setGeneralError(message);
                }
            } else if (status === 422 && err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setGeneralError(message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className={styles.form} onSubmit={fetchRegister} noValidate>
            <div className={styles.formHead}>
                <h2>Creá tu cuenta 🎶</h2>
                <p>Es gratis y no hace falta saber nada de música.</p>
            </div>

            <AuthField
                id="register-email" label="Correo electrónico" type="email" icon="mail"
                value={email} autoComplete="email" placeholder="nombre@mail.com"
                onChange={(e) => { setEmail(e.target.value); clear("email"); }}
                error={errors.email}
            >
                {errors.email?.includes("iniciar sesión") && (
                    <button type="button" className={styles.inlineLink} onClick={switchToLogin}>Ir a iniciar sesión →</button>
                )}
            </AuthField>
            <AuthField
                id="register-username" label="Nombre de usuario" icon="user"
                value={username} autoComplete="username" placeholder="Así te van a ver en la comunidad"
                onChange={(e) => { setUsername(e.target.value); clear("username"); }}
                error={errors.username}
            />
            <AuthField
                id="register-password" label="Contraseña" type="password" icon="lock"
                value={password} autoComplete="new-password" placeholder="Mínimo 8 caracteres"
                onChange={(e) => { setPassword(e.target.value); clear("password"); }}
                error={errors.password}
            >
                {password && (
                    <div className={styles.strength}>
                        <div className={`${styles.strengthBar} ${styles[`tone_${strength.tone}`]}`} aria-hidden="true">
                            {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= score ? styles.on : ""} />)}
                        </div>
                        <span className={styles.strengthLabel}>{strength.label}</span>
                        <ul className={styles.rules}>
                            {RULES.map((r) => (
                                <li key={r.id} className={r.test(password) ? styles.ruleOk : ""}>
                                    {r.test(password) ? "✓" : "○"} {r.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </AuthField>

            {generalError && <div className={styles.alert} role="alert">{generalError}</div>}

            <button type="submit" className={styles.button} disabled={loading}>
                {loading && <span className={styles.spinner} aria-hidden="true" />}
                {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>

            <p className={styles.switchText}>
                ¿Ya tenés cuenta?{" "}
                <button type="button" className={styles.linkButton} onClick={switchToLogin}>Iniciá sesión</button>
            </p>
        </form>
    );
}

export default Register_card;

import { useEffect, useState } from "react";
import FlipCard from "../components/login-register/flip_card";
import styles from "./css/login_register.module.css"; // "css" en minúscula: así está guardada la carpeta en git
import BrandLogo from "../components/general/BrandLogo.jsx";
import ThemeToggle from "../components/general/ThemeToggle.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../api/client";
import MusicStaff from "../components/general/MusicStaff.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Login_register(){
    const navigate = useNavigate();
    const location = useLocation();
    const initialMode = location.state?.mode === "register" ? "register" : "login";
    const { refreshUser, suspension, handleAccountSuspension, clearSuspension } = useAuth();
    const { syncWithConfiguration } = useTheme();
    const [now, setNow] = useState(0);

    useEffect(() => {
        if (!suspension || suspension.permanent) return undefined;
        const initialUpdate = window.setTimeout(() => setNow(Date.now()), 0);
        const timer = window.setInterval(() => setNow(Date.now()), 30000);
        return () => {
            window.clearTimeout(initialUpdate);
            window.clearInterval(timer);
        };
    }, [suspension]);

    async function handleAuthSuccess(token) {
        localStorage.setItem("token", token);
        const user = await refreshUser();
        if (!user) {
            throw new Error("No se pudo validar la sesión iniciada.");
        }

        try {
            const response = await api.get("/user/get/config/");

            const configuration = typeof response.data === "string"
                ? JSON.parse(response.data)
                : response.data;
            localStorage.setItem("user", JSON.stringify({ configuration }));
            // El tema guardado en la cuenta pasa a ser el tema de la app
            syncWithConfiguration(configuration);
        } catch (error) { console.error(error.response?.data || error); }

        navigate("/courses", { replace: true });
    }

    const expiryTime = suspension?.expiresAt ? Date.parse(suspension.expiresAt) : NaN;
    const suspensionExpired = now > 0 && Number.isFinite(expiryTime) && expiryTime <= now;
    const remainingDays = now > 0 && Number.isFinite(expiryTime)
        ? Math.max(0, Math.ceil((expiryTime - now) / 86400000))
        : suspension?.daysRemaining;

    return(
        <>
            <div className={styles.background}>
                <MusicStaff staves={1} notes={10} className={styles.staffBackground} />
                <div className={styles.glowA} aria-hidden="true" />
                <div className={styles.glowB} aria-hidden="true" />
                <header className={styles.topBar}>
                    <a href="/" className={styles.logoLink} aria-label="Volver al inicio">
                        <BrandLogo />
                    </a>
                    <ThemeToggle />
                </header>
                <div className={styles.mainContainer}>
                    <div className={styles.formContainer}>
                        {suspension ? (
                            <section className={styles.suspensionCard} role="status" aria-labelledby="suspension-title">
                                <span className={styles.suspensionIcon} aria-hidden="true">
                                    <svg viewBox="0 0 48 48">
                                        <path d="M24 5 44 41H4L24 5Z" />
                                        <path d="M24 17v11m0 7h.02" />
                                    </svg>
                                </span>
                                <p className={styles.suspensionEyebrow}>Moderación de KnowBeat</p>
                                <h1 id="suspension-title">Cuenta suspendida</h1>
                                <p>{suspension.permanent
                                    ? "La suspensión de esta cuenta es permanente."
                                    : suspensionExpired
                                        ? "El período de suspensión terminó. Ya podés intentar iniciar sesión."
                                        : "El acceso a la cuenta está pausado temporalmente."}</p>
                                <div className={styles.suspensionReason}>
                                    <strong>Motivo informado</strong>
                                    <p>{suspension.reason}</p>
                                </div>
                                {suspension.permanent ? (
                                    <p className={styles.suspensionExpiry}>La cuenta permanecerá bloqueada hasta una revisión administrativa.</p>
                                ) : (
                                    <>
                                        <p className={styles.suspensionExpiry}>
                                            {suspensionExpired
                                                ? "El acceso se restablece automáticamente al finalizar la sanción."
                                                : `Finaliza el ${Number.isFinite(expiryTime)
                                                    ? new Date(expiryTime).toLocaleString("es-AR")
                                                    : "horario no disponible"}.`}
                                        </p>
                                        {!suspensionExpired && Number.isFinite(remainingDays) && (
                                            <p className={styles.suspensionDays}>
                                                {remainingDays} {remainingDays === 1 ? "día" : "días"} restantes
                                            </p>
                                        )}
                                    </>
                                )}
                                {suspensionExpired && (
                                    <button type="button" className={styles.suspensionButton} onClick={clearSuspension}>
                                        Volver al inicio de sesión
                                    </button>
                                )}
                            </section>
                        ) : (
                            <FlipCard
                                onAuthSuccess={handleAuthSuccess}
                                onAccountSuspended={handleAccountSuspension}
                                initialMode={initialMode}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login_register
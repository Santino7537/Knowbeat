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
    const { refreshUser } = useAuth();
    const { syncWithConfiguration } = useTheme();

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
                        <FlipCard onAuthSuccess={handleAuthSuccess} initialMode={initialMode} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login_register
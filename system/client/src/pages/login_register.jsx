import FlipCard from "../components/login-register/flip_card";
import styles from "./css/login_register.module.css";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Login_register(){
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    async function handleAuthSuccess(token) {
        localStorage.setItem("token", token);
        const user = await refreshUser();
        if (!user) {
            throw new Error("No se pudo validar la sesión iniciada.");
        }

        try {
            const response = await axios.get("http://localhost:3000/user/get/config/",
                {headers: { Authorization: `Bearer ${token}` }}
            );

            const configuration = typeof response.data === "string"
                ? JSON.parse(response.data)
                : response.data;
            localStorage.setItem("user", JSON.stringify({ configuration }));
        } catch (error) { console.error(error.response?.data || error); }

        navigate("/courses", { replace: true });
    }

    return(
        <>
            <div className={styles.background}>
                <div className={styles.mainContainer}>
                    <div className={styles.formContainer}>
                        <FlipCard onAuthSuccess={handleAuthSuccess} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login_register
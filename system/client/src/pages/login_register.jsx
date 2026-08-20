import FlipCard from "../components/login-register/flip_card";
import styles from "./css/login_register.module.css";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

function Login_register(){
    const navigate = useNavigate();

    async function handleLoginSuccess(token) {
        localStorage.setItem("token", token);

        try {
            const response = await axios.get("http://localhost:3000/user/get/config/",
                {headers: { Authorization: `Bearer ${token}` }}
            );

            const configuration = typeof response.data === "string"
                ? JSON.parse(response.data)
                : response.data;
            localStorage.setItem("user", JSON.stringify({ configuration }));
        } catch (error) { console.error(error.response?.data || error); }

        navigate("/settings"); // redirige a la página principal
    }

    return(
        <>
            <div className={styles.background}>
                <div className={styles.mainContainer}>
                    <div className={styles.formContainer}>
                        <FlipCard onLoginSuccess={handleLoginSuccess} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login_register
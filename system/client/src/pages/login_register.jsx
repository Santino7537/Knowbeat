import FlipCard from "../components/login-register/flip_card";
import styles from "./css/login_register.module.css";
import axios from 'axios';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login_register(){
    const [showLogin, setShowLogin] = useState(true);
    const navigate = useNavigate();

    async function handleLoginSuccess(token) {
        localStorage.setItem("token", token);

        try {
            const response = await axios.get("http://localhost:3000/user/get/config/",
                {headers: { Authorization: `Bearer ${token}` }}
            );
            
            localStorage.setItem("user", JSON.stringify(response.data));
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
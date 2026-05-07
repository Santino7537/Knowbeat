import FlipCard from "../components/login-register/flip_card";
import styles from "./css/login_register.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login_register(){
    const [showLogin, setShowLogin] = useState(true);
    // const navigate = useNavigate();

    function handleLoginSuccess(token) {
        localStorage.setItem("token", token);
        // navigate("/"); // redirige a la página principal
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
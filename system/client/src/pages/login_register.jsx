import Login_card from "../components/login-register/login_card.jsx"
import Register_card from "../components/login-register/register_card.jsx";
import styles from "./css/login_register.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login(){
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
                        {showLogin ? (
                            <Login_card onLoginSuccess={handleLoginSuccess}/>
                        ) : (
                            <Register_card />
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login
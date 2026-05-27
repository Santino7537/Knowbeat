import { useState } from 'react';
import Register_card from './register_card';
import styles from './form_card.module.css'
import ValidationModal from '../general/validation_modal.jsx';

function Login_card({ onLoginSuccess ,  switchToRegister }){
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [missingFields, setMissingFields] = useState(null);

    function validateLogin() {
        const missing = [];
        if (!username.trim()) missing.push("Nombre de usuario");
        if (!password) missing.push("Contraseña");
        return missing;
    }

    async function fetchLogin(event) {
        const missing = validateLogin();
        if (missing.length > 0) {
            setMissingFields(missing);
            return;
        }
        event.preventDefault(); // evita recargar la página
    
        try {
            const response = await axios.post("http://localhost:3000/login", {
                username,
                password
            });

            onLoginSuccess(response.data.token); // redirige
        } catch (err) {
            console.error("Error en login:", err);
            alert("Usuario o contraseña incorrectos");
        }
    }

    return(
        <>
            <ValidationModal missingFields={missingFields} onClose={() => setMissingFields(null)}/>
            <div className={styles.card}>
                <section className={styles.section} id={styles.main_section}>
                    <h2>Iniciar Sesión</h2>
                    <form action="" className={styles.form} onSubmit={ fetchLogin }>
                        <label htmlFor="username">Nombre de usuario</label>
                        <input type="text" id='username' className={styles.input} onChange={(event) => setUsername(event.target.value)}/>
                        <label htmlFor="password">Contraseña</label>
                        <input type="password" id='password' className={styles.input} onChange={(event) => setPassword(event.target.value)}/>
                        <div className={styles.forgot_password}>
                            <a href="#">Olvidé mi contraseña</a>
                        </div>
                        <button type='submit' className={styles.button} onClick={() => fetchLogin()}>Iniciar Sesión</button>
                    </form>
                </section>
                <section className={styles.section} id={styles.change_section}>
                    <h2>¿No tiene cuenta?</h2>
                    <p>Registrese aquí</p>
                    <button className={styles.button} onClick={ switchToRegister }>Registrarse</button>
                </section>
            </div>
        </>
    )
}

export default Login_card
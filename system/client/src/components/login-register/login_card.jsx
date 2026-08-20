import { useState } from 'react';
import styles from './form_card.module.css'
import axios from 'axios'
import { useFieldErrors } from "../general/use_field_error.jsx";
import { FieldError } from "../general/field_error.jsx";

function Login_card({ onLoginSuccess ,  switchToRegister }){
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const { errors, setError, setErrors, clearError } = useFieldErrors();

    function validateForm() {
        const newErrors = {};
        if (!username.trim()) newErrors.username = "El nombre de usuario es obligatorio";
        if (!password) newErrors.password = "La contraseña es obligatoria";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }


    async function fetchLogin(event) {
        event.preventDefault(); // evita recargar la página
        if (!validateForm()) return;
    
        try {
            const response = await axios.post("http://localhost:3000/login", {
                username,
                password
            });
            onLoginSuccess(response.data.token); // redirige
        } catch (err) {
            const status = err.response?.status;
            if (status === 400 || status === 401) {
                // Credenciales incorrectas: error en ambos campos para no revelar cuál falló
                setErrors({
                username: "Usuario o contraseña incorrectos",
                password: "Usuario o contraseña incorrectos",});
            } else {
                setError("general", "No se pudo conectar. Intentá de nuevo.");
            }
        }
    }

    return(
        <>
            <div className={styles.card}>
                <section className={styles.section} id={styles.main_section}>
                    <h2>Iniciar Sesión</h2>
                    <form action="" className={styles.form} onSubmit={ fetchLogin }>
                        <label htmlFor="username">Nombre de usuario</label>
                        <input
                            type="text" id="username"
                            className={`${styles.input} ${errors.username ? styles.input_error : ""}`}
                            onChange={(e) => { setUsername(e.target.value); clearError("username"); }}/>
                        <FieldError message={errors.username}/>
                        
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password" id="password"
                            className={`${styles.input} ${errors.password ? styles.input_error : ""}`}
                            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}/>
                        <FieldError message={errors.password} />

                        <div className={styles.forgot_password}>
                            <a href="#">Olvidé mi contraseña</a>
                        </div>

                        {errors.general && <FieldError message={errors.general} />}

                        <button type='submit' className={styles.button}>Iniciar Sesión</button>
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
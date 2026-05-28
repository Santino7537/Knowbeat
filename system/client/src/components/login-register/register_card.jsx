import { useState } from 'react'
import styles from './form_card.module.css';
import axios from 'axios'
import { useFieldErrors } from "../general/use_field_error.jsx";
import { FieldError } from "../general/field_error.jsx";

function Register_card({ switchToLogin }){
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const { errors, setError, setErrors, clearError } = useFieldErrors();

    // Validación del lado del cliente — devuelve true si todo está OK
    function validateForm() {
        const newErrors = {};
        if (!email.trim()) newErrors.email = "El correo electrónico es obligatorio";
        if (!username.trim()) newErrors.username = "El nombre de usuario es obligatorio";
        if (!password) newErrors.password = "La contraseña es obligatoria";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function fetchRegister() {
        if (!validateForm()) return;
        
        try {
            const response = await axios.post("http://localhost:3000/register", {
                password, username, email,
            });
            console.log(response);
        }
        catch (err) {
            // Errores del servidor → mismo sistema, distintos mensajes
            const status = err.response?.status;
            if (status === 409) {
                // El servidor indica que el correo ya existe
                setError("email", "Este correo ya está registrado");
            } else if (status === 422) {
                // El servidor devuelve qué campos son inválidos (ejemplo)
                const serverErrors = err.response?.data?.errors ?? {};
                setErrors(serverErrors); // { email: "...", username: "..." }
            } else {
                setError("general", "Ocurrió un error. Intentá de nuevo.");
            }
        }
    }

    function checkPasswordStrength(password) {
        let score = 0;
        if (password.length > 0) score++;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    }

    const strength = checkPasswordStrength(password);

    const getColor = (score) => {
        switch (score) {
        case 0: return "transparent";
        case 1: return "red";
        case 2: return "orange";
        case 3: return "gold";
        case 4: return "green";
        case 5: return "darkgreen";
        default: return "black";
        }
    };

    const getLabel = (score) => {
        switch (score) {
        case 0: return "---"
        case 1: return "Muy débil";
        case 2: return "Débil";
        case 3: return "Aceptable";
        case 4: return "Fuerte";
        case 5: return "Muy fuerte";
        default: return "";
        }
    };

    return (
        <>
            <div className={styles.card}>
                <section className={styles.section} id={styles.change_section}>
                    <h2>¿Ya tienes una cuenta?</h2>
                    <p>Inicia Sesión acá</p>
                    <button type="button" className={styles.button} onClick={switchToLogin}>
                    Iniciar Sesión
                    </button>
                </section>
                <section className={styles.section}>
                    <h2>Registrate</h2>
                    <form className={styles.form}>

                    <label htmlFor="email">Correo electrónico</label>
                    <input
                        type="email" id="email"
                        className={`${styles.input} ${errors.email ? styles.input_error : ""}`}
                        placeholder="ejemplo@mail.com"
                        onChange={(e) => { setEmail(e.target.value); clearError("email"); }}/>
                    <FieldError message={errors.email}/>

                    <label htmlFor="usuario">Usuario</label>
                    <input
                        type="text" id="usuario"
                        className={`${styles.input} ${errors.username ? styles.input_error : ""}`}
                        placeholder="Nombre de usuario"
                        onChange={(e) => { setUsername(e.target.value); clearError("username"); }}/>
                    <FieldError message={errors.username}/>
                    
                    <label htmlFor="contraseña">Contraseña</label>
                    <input
                        type="password" id="contraseña"
                        className={`${styles.input} ${errors.password ? styles.input_error : ""}`}
                        onChange={(e) => { setPassword(e.target.value); clearError("password"); }}/>
                    <FieldError message={errors.password}/>

                    <div className={styles.password_strength} style={{ color: getColor(strength) }}>
                        {getLabel(strength)}
                    </div>

                    {errors.general && <FieldError message={errors.general} />}

                    <button type="button" className={styles.button} onClick={() => fetchRegister()}>
                        Registrarse
                    </button>
                    </form>
                </section>
            </div>
        </> 
  );
}

export default Register_card
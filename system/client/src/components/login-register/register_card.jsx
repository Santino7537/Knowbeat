import { useState } from 'react'
import styles from './form_card.module.css';
import axios from 'axios'
import ValidationModal from '../general/validation_modal.jsx';

function Register_card({ switchToLogin }){
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [missingFields, setMissingFields] = useState(null);

    function validateRegister() {
        const missing = [];
        if (!email.trim()) missing.push("Correo electrónico");
        if (!username.trim()) missing.push("Usuario");
        if (!password) missing.push("Contraseña");
        return missing;
    }

    async function fetchRegister() {
        const missing = validateRegister();
        if (missing.length > 0) {
            setMissingFields(missing);
            return;
        }

        const response = await axios.post("http://localhost:3000/register", {
            password,
            username,
            email
        })

        console.log(response)
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
            <ValidationModal missingFields={missingFields} onClose={() => setMissingFields(null)}/>

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
                    <input type="email" id="email" className={styles.input} placeholder="ejemplo@mail.com" onChange={(event) => setEmail(event.target.value)} />
                    <label htmlFor="usuario">Usuario</label>
                    <input type="text" id="usuario" className={styles.input} placeholder="Nombre de usuario" onChange={(event) => setUsername(event.target.value)} />
                    <label htmlFor="contraseña">Contraseña</label>
                    <input type="password" id="contraseña" className={styles.input} onChange={(event) => setPassword(event.target.value)} />
                    <div className={styles.password_strength} style={{ color: getColor(strength) }}>
                        {getLabel(strength)}
                    </div>
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
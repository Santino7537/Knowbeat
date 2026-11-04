import { useState } from "react";
import Login_card from "./login_card";
import Register_card from "./register_card";
import BrandLogo from "../general/BrandLogo.jsx";
import styles from "./flip_card.module.css";

const PERKS = [
  "Cursos de diversos instrumentos desde 0",
  "Ejercicios para practicar a tu ritmo",
  "Una comunidad para compartir y preguntar",
];

// Panel de autenticación: lado de marca + formulario con pestañas.
// (Mantiene el nombre de archivo original para no romper imports.)
export default function FlipCard({ onAuthSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const isLogin = mode === "login";

  return (
    <div className={styles.shell}>
      {/* Lado de marca */}
      <aside className={styles.brand} aria-hidden="true">
        <div className={styles.brandGlow} />
        <BrandLogo variant="mark" className={styles.brandMark} label="" />
        <h1 className={styles.brandTitle}>Tu música,<br />a tu ritmo.</h1>
        <ul className={styles.perks}>
          {PERKS.map((perk) => (
            <li key={perk}>{perk}</li>
          ))}
        </ul>
        <div className={styles.eq}>
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${(i * 0.13) % 1.2}s`, animationDuration: `${0.9 + (i % 5) * 0.15}s` }} />
          ))}
        </div>
      </aside>

      {/* Formulario */}
      <section className={styles.panel}>
        <div className={styles.tabs} role="tablist" aria-label="Elegí una opción">
          <span className={`${styles.tabIndicator} ${isLogin ? "" : styles.tabIndicatorRight}`} aria-hidden="true" />
          <button
            type="button" role="tab" aria-selected={isLogin}
            className={`${styles.tab} ${isLogin ? styles.tabActive : ""}`}
            onClick={() => setMode("login")}
          >
            Iniciar sesión
          </button>
          <button
            type="button" role="tab" aria-selected={!isLogin}
            className={`${styles.tab} ${!isLogin ? styles.tabActive : ""}`}
            onClick={() => setMode("register")}
          >
            Crear cuenta
          </button>
        </div>

        <div key={mode} className={styles.formSlot}>
          {isLogin ? (
            <Login_card onAuthSuccess={onAuthSuccess} switchToRegister={() => setMode("register")} />
          ) : (
            <Register_card onAuthSuccess={onAuthSuccess} switchToLogin={() => setMode("login")} />
          )}
        </div>
      </section>
    </div>
  );
}

import { useState } from "react";
import styles from "./form_card.module.css";

// Campo de formulario de login/registro con ícono, error y (si es contraseña)
// botón para mostrar/ocultar y aviso de Bloq Mayús.
const ICONS = {
  user: <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.5-8 5.5V21h16v-1.5c0-3-3.6-5.5-8-5.5Z" />,
  mail: <path d="M3 5h18v14H3V5Zm2 2v.4l7 4.6 7-4.6V7H5Zm14 2.8-7 4.6-7-4.6V17h14V9.8Z" />,
  lock: <path d="M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10H7Zm2 0h6V7a3 3 0 0 0-6 0v3Zm3 4a1.5 1.5 0 0 0-1 2.6V18h2v-1.4a1.5 1.5 0 0 0-1-2.6Z" />,
};

export default function AuthField({
  id, label, type = "text", icon = "user", value, onChange, error,
  autoComplete, placeholder, autoFocus, children,
}) {
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const checkCaps = (e) => {
    if (isPassword && e.getModifierState) setCapsLock(e.getModifierState("CapsLock"));
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={`${styles.control} ${error ? styles.controlError : ""}`}>
        <svg className={styles.fieldIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{ICONS[icon]}</svg>
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          className={styles.input}
          value={value}
          onChange={onChange}
          onKeyUp={checkCaps}
          onKeyDown={checkCaps}
          onBlur={() => setCapsLock(false)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error?.trim() ? `${id}-error` : undefined}
          spellCheck={false}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.eye}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
            title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.6 3.7M6.6 6.6C4.4 8 2.9 10 2 12c1 2.5 5 7 10 7 1.6 0 3-.4 4.3-1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {capsLock && <span className={styles.hint}>⇪ Bloq Mayús está activado</span>}
      {error?.trim() && <span id={`${id}-error`} className={styles.error} role="alert">{error}</span>}
      {children}
    </div>
  );
}

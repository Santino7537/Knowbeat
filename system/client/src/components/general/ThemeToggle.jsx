import { useTheme } from "../../context/ThemeContext.jsx";
import styles from "./ThemeToggle.module.css";

// Botón circular que alterna claro/oscuro con una animación sol ↔ luna.
const ThemeToggle = ({ className = "" }) => {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Activar modo claro" : "Activar modo oscuro";

  return (
    <button
      type="button"
      className={`${styles.toggle} ${isDark ? styles.dark : styles.light} ${className}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {/* Sol */}
      <svg className={styles.sun} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <g strokeLinecap="round">
          <line x1="12" y1="2.5" x2="12" y2="4.6" />
          <line x1="12" y1="19.4" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="4.6" y2="12" />
          <line x1="19.4" y1="12" x2="21.5" y2="12" />
          <line x1="5.3" y1="5.3" x2="6.8" y2="6.8" />
          <line x1="17.2" y1="17.2" x2="18.7" y2="18.7" />
          <line x1="5.3" y1="18.7" x2="6.8" y2="17.2" />
          <line x1="17.2" y1="6.8" x2="18.7" y2="5.3" />
        </g>
      </svg>

      {/* Luna */}
      <svg className={styles.moon} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z" />
      </svg>
    </button>
  );
};

export default ThemeToggle;

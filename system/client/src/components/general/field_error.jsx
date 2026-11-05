import styles from "./field_error.module.css";

/**
 * Muestra el mensaje de error debajo de un campo.
 * No renderiza nada si message está vacío.
 */
export function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className={styles.field_error} role="alert">
      {message}
    </span>
  );
}
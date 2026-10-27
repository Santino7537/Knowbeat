import styles from './ContactCard.module.css'

export default function ContactCard({ name, avatar, lastMessage, isActive, onClick }) {
  // Es un <button> y no un <div onClick> porque el botón es enfocable con Tab y se activa
  // con Enter/Espacio sin código extra. aria-current le avisa a los lectores de pantalla
  // cuál es la conversación abierta (no depender solo del color del borde).
  // Dentro de un <button> solo es válido HTML "inline", por eso todo son <span>.
  return (
    <button
      type="button"
      className={`${styles.card} ${isActive ? styles.active : ''}`}
      aria-current={isActive ? 'true' : undefined}
      onClick={onClick}
    >
      {avatar ? (
        <img className={styles.avatar} src={avatar} alt="" /> /* alt vacío: el nombre ya está al lado */
      ) : (
        <span className={styles.avatar} />
      )}
      <span className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.lastMessage}>{lastMessage}</span>
      </span>
    </button>
  )
}
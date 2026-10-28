import styles from './ContactCard.module.css'

export default function ContactCard({ name, avatar, lastMessage, unreadCount = 0, isActive, onClick }) {
  // Es un <button> y no un <div onClick> porque el botón es enfocable con Tab y se activa
  // con Enter/Espacio sin código extra. aria-current le avisa a los lectores de pantalla
  // cuál es la conversación abierta (no depender solo del color del borde).
  // Dentro de un <button> solo es válido HTML "inline", por eso todo son <span>.

  // Con 3 cifras el círculo se ensancharía demasiado y taparía el nombre: se topa en 99+.
  const badgeText = unreadCount > 99 ? '+99' : unreadCount
  console.log(styles)
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

      {/* Solo el círculo con el número. Se dibuja únicamente si hay mensajes sin leer. */}
      {unreadCount > 0 && <span className={styles.badge}>{badgeText}</span>}
    </button>
  )
}
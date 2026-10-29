import styles from './MessageBubble.module.css'

// Formatear la hora para que cada usuario la vea en su zona horaria.
function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ text, created_at, isOwn }) {
  return (
    <div className={`${styles.bubble} ${isOwn ? styles.own : styles.other}`}>
      <p className={styles.text}>{text}</p>
      <time className={styles.time} dateTime={created_at}>
        {formatTime(created_at)}
      </time>
    </div>
  )
}
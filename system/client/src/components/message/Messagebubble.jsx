import styles from './MessageBubble.module.css'

// Formatear la hora acá (y no en el backend) hace que cada usuario la vea en su zona horaria.
function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ text, createdAt, isOwn }) {
  // Se combinan dos clases del módulo: la base (styles.bubble) y la del lado
  // (styles.own / styles.other). Esta última controla todo el espejado:
  // lado, cola y posición de la hora. Así no se duplican componentes.
  return (
    <div className={`${styles.bubble} ${isOwn ? styles.own : styles.other}`}>
      <p className={styles.text}>{text}</p>
      {/* <time> con dateTime: es el elemento semántico para horas */}
      <time className={styles.time} dateTime={createdAt}>
        {formatTime(createdAt)}
      </time>
    </div>
  )
}
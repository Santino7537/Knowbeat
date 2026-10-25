import { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MessageBubble from '../components/message/Messagebubble'
import MessageInput from '../components/message/Messageinput'
// import { getMessages, sendMessage, MOCK_CURRENT_USER_ID } from '../services/messagesApi'
import styles from './CSS/Message.module.css'

// TODO: el usuario logueado vendrá de tu contexto de autenticación.
// const CURRENT_USER_ID = MOCK_CURRENT_USER_ID
// TODO: cuando exista la lista de la derecha, este amigo se elegirá desde ahí (useState).
const ACTIVE_FRIEND = { id: 2, name: 'Nombre de usuario', avatar: null }

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const listRef = useRef(null)
  const friend = ACTIVE_FRIEND

  // Carga el historial al abrir la conversación (y al cambiar de amigo).
  // `cancelled` evita actualizar el estado si se cambió de chat antes de que
  // llegue la respuesta (si no, se mezclarían mensajes de dos conversaciones).
//   useEffect(() => {
//     let cancelled = false
//     setError(null)
//     getMessages(friend.id)
//       .then((data) => !cancelled && setMessages(data))
//       .catch(() => !cancelled && setError('No se pudieron cargar los mensajes.'))
//     return () => { cancelled = true }
//   }, [friend.id])

  // Cada vez que cambia la lista, bajamos al último mensaje.
//   useEffect(() => {
//     const el = listRef.current
//     el.scrollTop = el.scrollHeight
//   }, [messages])

  // Se agrega el mensaje cuando el servidor responde (no antes) porque es el
  // servidor quien asigna el id y la hora oficial. Relanza el error para que
  // el input sepa que falló y conserve el texto.
  const handleSend = async (text) => {
    // try {
    //   setError(null)
    //   const saved = await sendMessage(friend.id, text)
    //   setMessages((prev) => [...prev, saved])
    // } catch (err) {
    //   setError('No se pudo enviar el mensaje. Intenta de nuevo.')
    //   throw err
    // }
  }

  return (
    <div className={styles.page}>
      <Sidebar />

      <main className={styles.chat}>
        <header className={styles.header}>
          {friend.avatar ? (
            <img className={styles.avatar} src={friend.avatar} alt="" />
          ) : (
            <div className={styles.avatar} />
          )}
          <h1 className={styles.name}>{friend.name}</h1>
        </header>

        {error && <p className={styles.error} role="alert">{error}</p>}

        {/* role="log" + aria-live: los lectores de pantalla anuncian los mensajes nuevos */}
        {/* <div className={styles.list} ref={listRef} role="log" aria-live="polite">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              text={m.text}
              createdAt={m.createdAt}
              isOwn={m.senderId === CURRENT_USER_ID}
            />
          ))}
        </div> */}

        <div className={styles.composer}>
          <MessageInput onSend={handleSend} />
        </div>
      </main>

      {/* Panel derecho: por ahora solo el contenedor. Acá irá la lista de conversaciones. */}
      <aside className={styles.conversations} aria-label="Conversaciones" />
    </div>
  )
}
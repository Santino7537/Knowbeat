import { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MessageBubble from '../components/message/Messagebubble'
import MessageInput from '../components/message/Messageinput'
import ContactList from '../components/message/Contactlist'
import styles from './CSS/Message.module.css'

// `currentUserId` es el id del usuario logueado. Se recibe por props porque la página no
// debe inventarlo ni leerlo de un valor fijo; se usa para decidir de qué lado va cada mensaje.
// TODO: cuando exista el contexto de autenticación, reemplazar la prop por ese hook.
export default function Messages({ currentUserId }) {
  const [contacts, setContacts] = useState([])
  // Se guarda solo el id (no el objeto contacto): así hay una única fuente de verdad.
  // Si el contacto se actualiza en `contacts` (ej. su último mensaje), `friend` se actualiza solo.
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const listRef = useRef(null)

  const friend = contacts.find((c) => c.id === activeId) ?? null

  // La suscripción a mensajes nuevos se crea UNA vez, pero necesita saber cuál es la conversación
  // abierta "ahora". Si leyera `activeId` directo, se quedaría con el valor de cuando se creó
  // (closure viejo). Por eso se guarda en una ref que se mantiene al día.
  const activeIdRef = useRef(null)
  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  // Carga la lista de contactos una sola vez y deja abierta la primera conversación.
  useEffect(() => {
    let cancelled = false
    getConversations()
      .then((data) => {
        if (cancelled) return
        setContacts(data)
        setActiveId((prev) => prev ?? data[0]?.id ?? null)
      })
      .catch(() => !cancelled && setError('No se pudieron cargar las conversaciones.'))
    return () => { cancelled = true }
  }, [])

  // Carga el historial cada vez que cambia la conversación activa.
  // Se vacía la lista primero para no mostrar un instante los mensajes del chat anterior.
  // `cancelled` evita que una respuesta tardía de otro chat pise a la actual.
  useEffect(() => {
    if (activeId === null) return
    let cancelled = false
    setError(null)
    setMessages([])
    getMessages(activeId)
      .then((data) => !cancelled && setMessages(data))
      .catch(() => !cancelled && setError('No se pudieron cargar los mensajes.'))
    return () => { cancelled = true }
  }, [activeId])

  // Entrar a una conversación = leerla: se borra el contador en pantalla y se avisa al backend.
  // Está en un efecto sobre `activeId` (y no en el onClick) para cubrir también la conversación
  // que se abre sola al cargar la página. El contador se borra primero en pantalla para que
  // la respuesta sea inmediata; si el aviso al backend falla, no se interrumpe al usuario
  // (el contador volvería a aparecer en la próxima carga).
  useEffect(() => {
    if (activeId === null) return
    setContacts((prev) => prev.map((c) => (c.id === activeId && c.unreadCount ? { ...c, unreadCount: 0 } : c)))
    markAsRead(activeId).catch(() => {})
  }, [activeId])

  // Mensajes recibidos. Dos casos, según dónde esté el usuario en ese momento:
  //  - Es la conversación abierta: el mensaje se agrega al chat, NO suma contador (el usuario
  //    lo está viendo) y se marca como leído.
  //  - Es otra conversación: suma 1 al contador de esa card.
  // En ambos casos la card actualiza su último mensaje.
  // El remitente es el amigo, por eso senderId identifica la conversación.
  useEffect(() => {
    return subscribeToMessages((message) => {
      const isOpen = message.senderId === activeIdRef.current

      setContacts((prev) =>
        prev.map((c) =>
          c.id === message.senderId
            ? { ...c, lastMessage: message.text, unreadCount: isOpen ? 0 : (c.unreadCount ?? 0) + 1 }
            : c
        )
      )

      if (isOpen) {
        setMessages((prev) => [...prev, message])
        markAsRead(message.senderId).catch(() => {})
      }
      // TODO: si llega un mensaje de alguien que todavía no está en `contacts`
      // (un amigo nuevo), habrá que pedir la lista de nuevo. Por ahora se ignora.
    })
  }, [])

  // Cada vez que cambia la lista, bajamos al último mensaje.
  useEffect(() => {
    const el = listRef.current
    el.scrollTop = el.scrollHeight
  }, [messages])

  // Se agrega el mensaje cuando el servidor responde (no antes) porque es el
  // servidor quien asigna el id y la hora oficial. Relanza el error para que
  // el input sepa que falló y conserve el texto.
  const handleSend = async (text) => {
    try {
      setError(null)
      const saved = await sendMessage(activeId, text)
      setMessages((prev) => [...prev, saved])
      // La card del contacto muestra el último mensaje: se actualiza acá para que
      // coincida con lo que acaba de pasar en el chat, sin volver a pedir la lista.
      setContacts((prev) => prev.map((c) => (c.id === activeId ? { ...c, lastMessage: saved.text } : c)))
    } catch (err) {
      setError('No se pudo enviar el mensaje. Intenta de nuevo.')
      throw err
    }
  }

  return (
    <div className={styles.page}>
      <Sidebar />

      <main className={styles.chat}>
        {friend && (
          <header className={styles.header}>
            {friend.avatar ? (
              <img className={styles.avatar} src={friend.avatar} alt="" />
            ) : (
              <div className={styles.avatar} />
            )}
            <h1 className={styles.name}>{friend.name}</h1>
          </header>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        {/* role="log" + aria-live: los lectores de pantalla anuncian los mensajes nuevos */}
        <div className={styles.list} ref={listRef} role="log" aria-live="polite">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              text={m.text}
              createdAt={m.createdAt}
              isOwn={m.senderId === currentUserId}
            />
          ))}
        </div>

        {/* Sin conversación abierta no hay a quién escribirle */}
        {friend && (
          <div className={styles.composer}>
            <MessageInput onSend={handleSend} />
          </div>
        )}
      </main>

      <ContactList contacts={contacts} activeId={activeId} onSelect={setActiveId} />
    </div>
  )
}
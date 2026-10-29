import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from '../components/Sidebar'
import MessageBubble from '../components/message/Messagebubble'
import MessageInput from '../components/message/Messageinput'
import ContactList from '../components/message/Contactlist'
import styles from './CSS/Message.module.css'
import axios from "axios";
import { io } from 'socket.io-client'

const API_URL = 'http://localhost:3000'
const MESSAGE_PAGE_SIZE = 30

export default function Messages() {
  const { loggedUser } = useAuth();
  const currentUserId = loggedUser.id;

  const [friendChats, setFriendChats] = useState({})
  const [currentFriendId, setCurrentFriendId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadedFriendshipId, setLoadedFriendshipId] = useState(null)
  const [error, setError] = useState(null)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false)
  const listRef = useRef(null)
  const socketRef = useRef(null)
  const friendChatsRef = useRef(friendChats)
  const currentFriendshipIdRef = useRef(null)
  const loadingOlderMessagesRef = useRef(false)
  const scrollAnchorRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)
  const friend = friendChats[currentFriendId] ?? null
  const friendshipIds = Object.values(friendChats).map((chat) => chat.friendship_id).filter(Boolean)
  const friendshipIdsKey = friendshipIds.join(',')
  const currentFriendIdRef = useRef(currentFriendId)
  const visibleMessages = loadedFriendshipId === friend?.friendship_id ? messages : []

  useEffect(() => {
    friendChatsRef.current = friendChats
  }, [friendChats])

  useEffect(() => {
    currentFriendshipIdRef.current = friend?.friendship_id ?? null
  }, [friend?.friendship_id])

  useEffect(() => {
    currentFriendIdRef.current = currentFriendId
  }, [currentFriendId])

  // Carga la lista de contactos una sola vez y deja abierta la primera conversación.
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.get(
      "http://localhost:3000/friend/list",
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(({data}) => {
        setFriendChats(data)
        setCurrentFriendId((prev) => prev ?? Object.keys(data)[0] ?? null)
      })
      .catch(() => setError('No se pudieron cargar las conversaciones.'))
  }, [])

  // Carga el historial cada vez que cambia la conversación activa.
  useEffect(() => {
    const friendshipId = friend?.friendship_id
    if (currentFriendId === null || !friendshipId) return

    let cancelled = false
    loadingOlderMessagesRef.current = false
    scrollAnchorRef.current = null
    shouldStickToBottomRef.current = true

    const token = localStorage.getItem("token");
    axios.get(`${API_URL}/chat/${friendshipId}/messages`, {
      params: { limit: MESSAGE_PAGE_SIZE },
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ data }) => {
      if (cancelled) return
      setError(null)
      setMessages(data.data)
      setLoadedFriendshipId(friendshipId)
      setHasMoreMessages(data.data.length === MESSAGE_PAGE_SIZE)
    }).catch(() => {
      if (!cancelled) setError('No se pudieron cargar los mensajes.')
    })

    return () => { cancelled = true }
  }, [currentFriendId, friend?.friendship_id])

  // Marca como leídos los mensajes del chat actual
  useEffect(() => {
    const friendshipId = friend?.friendship_id
    if (currentFriendId === null || !friendshipId) return

    const token = localStorage.getItem("token");
    axios.patch(`${API_URL}/chat/${friendshipId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setFriendChats((prev) => prev[currentFriendId]?.unread_count
        ? { ...prev, [currentFriendId]: { ...prev[currentFriendId], unread_count: 0 } }
        : prev)
    }).catch(() => {})
  }, [currentFriendId, friend?.friendship_id])

  // Mantiene una conexión autenticada y escucha mensajes de todas las amistades.
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io(API_URL, { auth: { token } })
    socketRef.current = socket

    const handleMessage = (message) => {
      if (message.author_id === currentUserId) return

      const [friendId, chat] = Object.entries(friendChatsRef.current).find(([, item]) =>
        Number(item.friendship_id) === Number(message.friendship_id)
      ) ?? []
      if (!friendId || !chat) return

      const isOpen = currentFriendIdRef.current === friendId
      setFriendChats((prev) => {
        const currentChat = prev[friendId]
        if (!currentChat) return prev
        return {
          ...prev,
          [friendId]: {
            ...currentChat,
            last_message: message.text,
            unread_count: isOpen ? 0 : (currentChat.unread_count ?? 0) + 1
          }
        }
      })

      if (isOpen) {
        setMessages((prev) => prev.some((item) => String(item.id) === String(message.id))
          ? prev
          : [...prev, message])
        axios.patch(`${API_URL}/chat/${message.friendship_id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {})
      }
    }

    socket.on('chat:message', handleMessage)
    return () => {
      socket.off('chat:message', handleMessage)
      socket.disconnect()
      socketRef.current = null
    }
  }, [currentUserId])

  // El servidor autoriza cada sala antes de emitir sus mensajes al socket.
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    Object.values(friendChatsRef.current).forEach(({ friendship_id }) => {
      socket.emit('chat:join', { friendship_id })
    })
  }, [friendshipIdsKey])

  // Mantiene la posición al anteponer mensajes y sigue los nuevos si ya estaba abajo.
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return

    if (scrollAnchorRef.current) {
      const { height, top } = scrollAnchorRef.current
      el.scrollTop = top + el.scrollHeight - height
      scrollAnchorRef.current = null
    } else if (shouldStickToBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, loadedFriendshipId, friend?.friendship_id])

  const handleMessageListScroll = async (event) => {
    const element = event.currentTarget
    shouldStickToBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80

    const friendshipId = friend?.friendship_id
    const oldestMessage = visibleMessages[0]
    if (element.scrollTop > 40 || !hasMoreMessages || loadingOlderMessagesRef.current || !friendshipId || !oldestMessage?.created_at) {
      return
    }

    loadingOlderMessagesRef.current = true
    setLoadingOlderMessages(true)
    scrollAnchorRef.current = { height: element.scrollHeight, top: element.scrollTop }
    const token = localStorage.getItem('token')

    try {
      const { data } = await axios.get(`${API_URL}/chat/${friendshipId}/messages`, {
        params: { limit: MESSAGE_PAGE_SIZE, before: oldestMessage.created_at },
        headers: { Authorization: `Bearer ${token}` }
      })
      if (Number(currentFriendshipIdRef.current) !== Number(friendshipId)) return

      const olderMessages = data.data
      if (olderMessages.length === 0) {
        setHasMoreMessages(false)
        scrollAnchorRef.current = null
        return
      }

      setMessages((prev) => {
        const existingIds = new Set(prev.map((message) => String(message.id)))
        return [...olderMessages.filter((message) => !existingIds.has(String(message.id))), ...prev]
      })
      setLoadedFriendshipId(friendshipId)
      setHasMoreMessages(olderMessages.length === MESSAGE_PAGE_SIZE)
    } catch {
      scrollAnchorRef.current = null
      setError('No se pudieron cargar más mensajes.')
    } finally {
      loadingOlderMessagesRef.current = false
      setLoadingOlderMessages(false)
    }
  }

  const handleSelectFriend = (friendId) => {
    setCurrentFriendId(friendId)
    setFriendChats((prev) => prev[friendId]?.unread_count
      ? { ...prev, [friendId]: { ...prev[friendId], unread_count: 0 } }
      : prev)
  }

  // Maneja el envío de un mensaje
  const handleSend = async (text) => {
    try {
      setError(null)
      const token = localStorage.getItem("token");

      const { data } = await axios.post(`${API_URL}/chat/send`, {
        friendship_id: friend.friendship_id,
        text
      }, { headers: { Authorization: `Bearer ${token}` } })
      const message = data.message
      setMessages((prev) => prev.some((item) => String(item.id) === String(message.id))
        ? prev
        : [...prev, message])
      setFriendChats((prev) => prev[currentFriendId]
        ? { ...prev, [currentFriendId]: { ...prev[currentFriendId], last_message: message.text } }
        : prev)
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
            {friend.picture ? (
              <img className={styles.avatar} src={friend.picture} alt="" />
            ) : (
              <div className={styles.avatar} />
            )}
            <h1 className={styles.name}>{friend.username}</h1>
          </header>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        {/* role="log" + aria-live: los lectores de pantalla anuncian los mensajes nuevos */}
        <div className={styles.list} ref={listRef} onScroll={handleMessageListScroll} role="log" aria-live="polite">
          {loadingOlderMessages && <span role="status">Cargando mensajes...</span>}
          {visibleMessages.map((m) => (
            <MessageBubble
              key={m.id}
              text={m.text}
              created_at={m.created_at}
              isOwn={m.author_id === currentUserId}
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

      <ContactList friendChats={friendChats} currentFriendId={currentFriendId} onSelect={handleSelectFriend} />
    </div>
  )
}
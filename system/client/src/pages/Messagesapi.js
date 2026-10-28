import axios from 'axios'

// Interruptor para trabajar sin backend. Cuando tengas los endpoints reales,
// cambialo a false y el resto de la app no necesita tocarse: los componentes
// solo conocen estas funciones, no saben de dónde vienen los datos.
const USE_MOCK = true

// Se crea una instancia propia de axios (en vez de usar axios "pelado") para
// definir la URL base una sola vez. Si mañana cambia, se modifica en un lugar.
// Asume Vite; si usas Create React App, la variable es process.env.REACT_APP_API_URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
})
// TODO: cuando tengas autenticación, agregar acá un interceptor que mande el token.

// ── Datos de prueba (solo se usan con USE_MOCK = true) ──
export const MOCK_CURRENT_USER_ID = 1
const now = () => new Date().toISOString()

// 8 contactos para poder probar el scroll del panel. El segundo tiene un mensaje largo
// para ver el "..." del truncado, y algunos traen mensajes sin leer para ver el badge
// (el 6 tiene 120 para ver el tope "99+").
const mockConversations = [
  { id: 2, name: 'Nombre de usuario', avatar: null, lastMessage: 'OK', unreadCount: 0 },
  { id: 3, name: 'Nombre de usuario', avatar: null, unreadCount: 3, lastMessage: 'Este es un mensaje bastante largo para comprobar que se corta con puntos suspensivos' },
  ...[4, 5, 6, 7, 8, 9].map((id) => ({
    id,
    name: 'Nombre de usuario',
    avatar: null,
    lastMessage: 'Ultimo mensaje',
    unreadCount: id === 4 ? 1 : id === 6 ? 120 : 0,
  })),
]

// Cada mensaje guarda con qué amigo es la conversación (friendId), para que al cambiar
// de chat no se vean los mensajes de otro.
const mockMessages = [
  { id: 1, friendId: 2, senderId: 2, text: 'Amigo', createdAt: now() },
  { id: 2, friendId: 2, senderId: 2, text: 'Estoy', createdAt: now() },
  { id: 3, friendId: 2, senderId: 2, text: 'Muerto', createdAt: now() },
  { id: 4, friendId: 2, senderId: 1, text: 'OK', createdAt: now() },
]

// Forma de contacto que asumimos: { id, name, avatar, lastMessage, unreadCount }.
// unreadCount lo calcula el backend (así sobrevive a recargar la página o abrir otro dispositivo).
export async function getConversations() {
  if (USE_MOCK) return mockConversations.map((c) => ({ ...c }))
  const { data } = await api.get('/conversations') // TODO: ajustar ruta real
  return data
}

// Forma de mensaje que asumimos del backend: { id, senderId, text, createdAt (ISO) }.
// Usar senderId (y no un booleano "esMio") mantiene al backend neutral:
// el frontend decide de qué lado se dibuja comparando con el usuario logueado.
export async function getMessages(friendId) {
  if (USE_MOCK) return mockMessages.filter((m) => m.friendId === friendId)
  const { data } = await api.get(`/messages/${friendId}`) // TODO: ajustar ruta real
  return data
}

export async function sendMessage(friendId, text) {
  if (USE_MOCK) {
    const message = { id: Date.now(), friendId, senderId: MOCK_CURRENT_USER_ID, text, createdAt: now() }
    mockMessages.push(message)
    return message
  }
  const { data } = await api.post(`/messages/${friendId}`, { text }) // TODO: ajustar ruta real
  return data // se espera que el backend devuelva el mensaje guardado (con id y fecha)
}

// Le avisa al backend que el usuario ya leyó la conversación con este amigo, para que
// el contador quede en 0 también del lado del servidor (si no, volvería al recargar).
export async function markAsRead(friendId) {
  if (USE_MOCK) {
    const c = mockConversations.find((x) => x.id === friendId)
    if (c) c.unreadCount = 0
    return
  }
  await api.post(`/messages/${friendId}/read`) // TODO: ajustar ruta real
}

// Punto único por donde entran los mensajes recibidos. Quien llama pasa un callback y recibe
// una función para cancelar la suscripción. Cómo llegan los mensajes (polling con axios,
// WebSocket, etc.) queda encapsulado acá: cuando lo decidas, solo se cambia esta función.
// Se espera que cada mensaje recibido tenga la forma { id, senderId, text, createdAt }.
export function subscribeToMessages(onMessage) {
  if (!USE_MOCK) {
    // TODO: implementar el transporte real y llamar a onMessage(message) por cada mensaje nuevo.
    return () => {}
  }
  // Solo para pruebas: cada 10 segundos "llega" un mensaje de un contacto al azar.
  const timer = setInterval(() => {
    const friend = mockConversations[Math.floor(Math.random() * mockConversations.length)]
    const message = { id: Date.now(), friendId: friend.id, senderId: friend.id, text: 'Mensaje de prueba', createdAt: now() }
    mockMessages.push(message)
    onMessage({ ...message })
  }, 10000)
  return () => clearInterval(timer)
}
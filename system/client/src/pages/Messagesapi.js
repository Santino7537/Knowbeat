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

// 8 contactos para poder probar el scroll del panel. El primero tiene un mensaje largo
// para ver el "..." del truncado.
const mockConversations = [
  { id: 2, name: 'Nombre de usuario', avatar: null, lastMessage: 'OK' },
  { id: 3, name: 'Nombre de usuario', avatar: null, lastMessage: 'Este es un mensaje bastante largo para comprobar que se corta con puntos suspensivos' },
  ...[4, 5, 6, 7, 8, 9].map((id) => ({ id, name: 'Nombre de usuario', avatar: null, lastMessage: 'Ultimo mensaje' })),
]

// Cada mensaje guarda con qué amigo es la conversación (friendId), para que al cambiar
// de chat no se vean los mensajes de otro.
const mockMessages = [
  { id: 1, friendId: 2, senderId: 2, text: 'Amigo', createdAt: now() },
  { id: 2, friendId: 2, senderId: 2, text: 'Estoy', createdAt: now() },
  { id: 3, friendId: 2, senderId: 2, text: 'Muerto', createdAt: now() },
  { id: 4, friendId: 2, senderId: 1, text: 'OK', createdAt: now() },
]

// Forma de contacto que asumimos: { id, name, avatar, lastMessage }.
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
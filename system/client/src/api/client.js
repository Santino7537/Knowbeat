import axios from "axios";

// ── Cliente HTTP único para la API de Knowbeat ───────────────────────────────
// - baseURL fija (antes algunas pantallas usaban rutas relativas como
//   "/community/search", que iban al servidor de Vite y nunca a la API).
// - Agrega el token de sesión automáticamente en cada request.
// Uso:  import api, { getErrorMessage } from "../api/client";
//        const { data } = await api.get("/user/get/progress");

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({ baseURL: API_URL });

const notifySuspension = (error) => {
  const suspension = error.response?.data?.suspension;
  if (error.response?.data?.code === "ACCOUNT_SUSPENDED" && suspension && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("knowbeat:account-suspended", { detail: suspension }));
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    notifySuspension(error);
    return Promise.reject(error);
  }
);

export default api;

// ── Mensajes de error legibles ───────────────────────────────────────────────
// El backend responde a veces { message } y a veces { error }. Esta función
// devuelve siempre un texto en español que se puede mostrar al usuario.
export function getErrorMessage(error, fallback = "Ocurrió un error inesperado. Probá de nuevo.") {
  // Sin respuesta: el servidor está apagado, no hay internet o CORS bloqueó
  if (error && !error.response) {
    if (error.code === "ECONNABORTED") return "El servidor tardó demasiado en responder. Probá de nuevo.";
    return "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá otra vez.";
  }

  const { status, data } = error.response;
  const serverMessage =
    typeof data === "string" ? null : data?.message || data?.error || null;

  if (status === 401) return serverMessage === "Token inválido o expirado"
    ? "Tu sesión expiró. Volvé a iniciar sesión."
    : serverMessage || "Necesitás iniciar sesión para hacer esto.";
  if (status === 403) return serverMessage || "No tenés permiso para hacer esto.";
  if (status === 404) return serverMessage || "No encontramos lo que buscabas.";
  if (status === 413) return "El archivo o el contenido es demasiado grande.";
  if (status === 429) return "Hiciste demasiados intentos. Esperá un momento.";
  if (status >= 500) return serverMessage || "El servidor tuvo un problema. Probá de nuevo en unos minutos.";

  return serverMessage || fallback;
}

// Detecta a qué campo de un formulario corresponde un error del servidor,
// mirando el texto del mensaje (el backend usa el mismo código 409 para
// "usuario ya registrado" y "email ya registrado").
export function getErrorField(error) {
  const text = String(getErrorMessage(error, "")).toLowerCase();
  if (text.includes("email") || text.includes("correo")) return "email";
  if (text.includes("usuario") && text.includes("contraseña")) return "credentials";
  if (text.includes("usuario")) return "username";
  if (text.includes("contraseña")) return "password";
  return "general";
}

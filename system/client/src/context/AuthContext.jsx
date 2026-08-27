import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

// ── Contexto ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
// Envuelve toda la app. Gestiona el usuario logueado y lo expone a cualquier
// componente del árbol sin prop-drilling.
export function AuthProvider({ children }) {
  // null  → todavía no sabemos (cargando)
  // false → no hay sesión
  // {...} → usuario logueado
  const [loggedUser, setLoggedUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Llama al endpoint con el token guardado en localStorage.
  // Se exporta para poder refrescar manualmente si el usuario edita su perfil.
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoggedUser(false);
      setLoadingAuth(false);
      return;
    }
    try {
      const { data } = await axios.get(
        "http://localhost:3000/token/get/user",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoggedUser(data);           // { picture, username, biography }
    } catch (err) {
      // Token inválido / expirado → limpiar sesión
      console.warn("Sesión inválida:", err.response?.data ?? err.message);
      setLoggedUser(false);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  // Se ejecuta una única vez al montar la app
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ loggedUser, loadingAuth, refreshUser, setLoggedUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook de consumo ───────────────────────────────────────────────────────────
// Cualquier componente puede hacer: const { loggedUser } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
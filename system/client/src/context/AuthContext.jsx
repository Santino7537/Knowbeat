import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../api/client";

// ── Contexto ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const getAuthenticatedHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

// ── Provider ──────────────────────────────────────────────────────────────────
// Envuelve toda la app. Gestiona el usuario logueado y lo expone a cualquier
// componente del árbol sin prop-drilling.
export function AuthProvider({ children }) {
  // null  → todavía no sabemos (cargando)
  // false → no hay sesión
  // {...} → usuario logueado
  const [loggedUser, setLoggedUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [adminAuthorization, setAdminAuthorization] = useState(null);
  const [suspension, setSuspension] = useState(null);

  const handleAccountSuspension = useCallback((details) => {
    if (!details || typeof details.reason !== "string") return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAdminAuthorization(null);
    setLoggedUser(false);
    setSuspension(details);
  }, []);

  // Llama al endpoint con el token guardado en localStorage.
  // Se exporta para poder refrescar manualmente si el usuario edita su perfil.
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAdminAuthorization(null);
      setLoggedUser(false);
      setLoadingAuth(false);
      return false;
    }
    try {
      const { data } = await axios.get(
        `${API_URL}/token/get/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoggedUser(data);
      setSuspension(null);
      return data;
    } catch (err) {
      console.warn("Sesión inválida:", err.response?.data ?? err.message);
      if (err.response?.data?.code === "ACCOUNT_SUSPENDED") {
        handleAccountSuspension(err.response.data.suspension);
      } else if (err.response?.status === 401 || err.response?.status === 404) {
        localStorage.removeItem("token");
        setAdminAuthorization(null);
      }
      setLoggedUser(false);
      return false;
    } finally {
      setLoadingAuth(false);
    }
  }, [handleAccountSuspension]);

  // Se ejecuta una única vez al montar la app
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleSuspensionEvent = (event) => handleAccountSuspension(event.detail);
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data?.code === "ACCOUNT_SUSPENDED") {
          handleAccountSuspension(error.response.data.suspension);
        }
        return Promise.reject(error);
      }
    );
    window.addEventListener("knowbeat:account-suspended", handleSuspensionEvent);
    return () => {
      axios.interceptors.response.eject(interceptorId);
      window.removeEventListener("knowbeat:account-suspended", handleSuspensionEvent);
    };
  }, [handleAccountSuspension]);

  const verifyAdminPassword = useCallback(async (password) => {
    const { data } = await axios.post(
      `${API_URL}/admin/reauth`,
      { password },
      { headers: getAuthenticatedHeaders() }
    );
    const expiresAt = Date.parse(data.expires_at);
    if (typeof data.authorization !== "string"
      || !/^[a-f0-9]{64}$/i.test(data.authorization)
      || !Number.isFinite(expiresAt)) {
      throw new Error("La respuesta de autorización administrativa no es válida.");
    }

    const authorization = { token: data.authorization, expiresAt };
    setAdminAuthorization(authorization);
    return authorization;
  }, []);

  const validateAdminAuthorization = useCallback(async () => {
    if (!adminAuthorization || adminAuthorization.expiresAt <= Date.now()) {
      setAdminAuthorization(null);
      return false;
    }

    try {
      await axios.get(`${API_URL}/admin/session`, {
        headers: {
          ...getAuthenticatedHeaders(),
          "X-Admin-Authorization": adminAuthorization.token
        }
      });
      return true;
    } catch {
      setAdminAuthorization(null);
      return false;
    }
  }, [adminAuthorization]);

  const clearAdminAuthorization = useCallback(() => {
    setAdminAuthorization(null);
  }, []);

  const clearSuspension = useCallback(() => {
    setSuspension(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem("token")) {
        await axios.post(
          `${API_URL}/user/logout`,
          {},
          { headers: getAuthenticatedHeaders() }
        );
      }
    } catch (error) {
      console.error("No se pudo invalidar la autorización administrativa:", error.response?.data ?? error.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAdminAuthorization(null);
      setLoggedUser(false);
      setSuspension(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      loggedUser,
      loadingAuth,
      suspension,
      refreshUser,
      setLoggedUser,
      handleAccountSuspension,
      clearSuspension,
      adminAuthorization,
      verifyAdminPassword,
      validateAdminAuthorization,
      clearAdminAuthorization,
      logout
    }}>
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
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import styles from "../components/general/Toast.module.css";

// ── Avisos flotantes (toasts) ───────────────────────────────────────────────
// const toast = useToast();  toast.success("Publicado");  toast.error(msg);
const ToastContext = createContext(null);

const ICONS = {
  success: "✓",
  error: "!",
  info: "♪",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 260);
  }, []);

  const show = useCallback((type, message, duration = 4200) => {
    if (!message) return;
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const value = useMemo(() => ({
    success: (msg, d) => show("success", msg, d),
    error: (msg, d) => show("error", msg, d ?? 6000),
    info: (msg, d) => show("info", msg, d),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="region" aria-label="Notificaciones">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]} ${t.leaving ? styles.leaving : ""}`}
            role={t.type === "error" ? "alert" : "status"}
          >
            <span className={styles.icon} aria-hidden="true">{ICONS[t.type]}</span>
            <p className={styles.message}>{t.message}</p>
            <button type="button" className={styles.close} onClick={() => dismiss(t.id)} aria-label="Cerrar aviso">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

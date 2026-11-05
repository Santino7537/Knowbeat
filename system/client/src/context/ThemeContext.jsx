import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// ── Tema global (claro / oscuro) ─────────────────────────────────────────────
// Antes cada página agregaba/quitaba body.light-mode por su cuenta y al
// desmontarse lo borraba, por eso el modo claro "se perdía" al navegar.
// Ahora hay una sola fuente de verdad:
//   - se guarda en localStorage ("kb-theme")
//   - se aplica como <html data-theme="light|dark"> (lo leen los tokens CSS)
//   - se mantiene body.light-mode por compatibilidad con estilos viejos
// index.html aplica el tema antes de que cargue React para evitar el "flash".

const ThemeContext = createContext(null);

export const THEME_STORAGE_KEY = "kb-theme";

function themeFromConfiguration(configuration) {
  const darkMode = configuration?.appearance?.dark_mode;
  if (darkMode === false) return "light";
  if (darkMode === true) return "dark";
  return null;
}

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;

    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const fromConfig = themeFromConfiguration(storedUser?.configuration || storedUser);
    if (fromConfig) return fromConfig;
  } catch {
    // localStorage puede no estar disponible (modo privado): seguimos con el default
  }
  return "dark";
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  document.body.classList.toggle("light-mode", theme === "light");

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f4f7fb" : "#050b18");
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);
  const switchTimer = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const root = document.documentElement;

    // En el primer render no animamos (el tema ya viene aplicado desde index.html)
    if (!isFirstRender.current) {
      root.classList.add("kb-theme-switching");
      clearTimeout(switchTimer.current);
      switchTimer.current = setTimeout(() => {
        root.classList.remove("kb-theme-switching");
      }, 480);
    }
    isFirstRender.current = false;

    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // sin persistencia, pero el tema igual se aplica
    }
  }, [theme]);

  useEffect(() => () => clearTimeout(switchTimer.current), []);

  const setTheme = useCallback((next) => {
    setThemeState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      return value === "light" ? "light" : "dark";
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, [setTheme]);

  // Para sincronizar con la configuración que viene del backend (login / settings)
  const syncWithConfiguration = useCallback((configuration) => {
    const fromConfig = themeFromConfiguration(configuration);
    if (fromConfig) setTheme(fromConfig);
  }, [setTheme]);

  const value = useMemo(() => ({
    theme,
    isDark: theme === "dark",
    isLight: theme === "light",
    setTheme,
    toggleTheme,
    syncWithConfiguration,
  }), [theme, setTheme, toggleTheme, syncWithConfiguration]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}

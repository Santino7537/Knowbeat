// src/context/LanguageContext.jsx
import { createContext, useContext, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Obtener idioma guardado en el usuario o localStorage
  const getInitialLanguage = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      const savedLang = storedUser?.configuration?.appearance?.language || storedUser?.appearance?.language;
      return savedLang || "es-AR";
    } catch {
      return "es-AR";
    }
  };

  const [language, setLanguage] = useState(getInitialLanguage());

  // Función para traducir rutas anidadas (ej: "settings.title")
  const t = (path) => {
    const keys = path.split(".");
    let current = translations[language];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        return path; // Retorna la llave si no encuentra la traducción
      }
      current = current[key];
    }
    return current;
  };

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
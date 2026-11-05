import { useState } from "react";

/**
 * Hook genérico para manejar errores por campo.
 *
 * API:
 *   errors            → { email: "Mensaje", password: null, ... }
 *   setError(field, msg)  → pone un error en un campo
 *   setErrors(map)        → pone varios errores a la vez (útil para errores del servidor)
 *   clearError(field)     → limpia el error de un campo
 *   clearAll()            → limpia todos los errores
 */
export function useFieldErrors() {
  const [errors, setErrorMap] = useState({});

  const setError = (field, message) =>
    setErrorMap((prev) => ({ ...prev, [field]: message }));

  const setErrors = (map) =>
    setErrorMap((prev) => ({ ...prev, ...map }));

  const clearError = (field) =>
    setErrorMap((prev) => ({ ...prev, [field]: undefined }));

  const clearAll = () => setErrorMap({});

  return { errors, setError, setErrors, clearError, clearAll };
}
import { useLayoutEffect, useRef, useState } from 'react';
import styles from './Messageinput.module.css';
import { useLanguage } from '../../context/LanguageContext.jsx'; // <-- Importar hook de idioma (ajusta la ruta si es necesario)

export default function MessageInput({ onSend, placeholder }) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const ref = useRef(null);
  const { t } = useLanguage(); // <-- Consumir función de traducción

  // El texto por defecto se toma de las traducciones si no se pasa por prop
  const inputPlaceholder = placeholder || t('message_input.default_placeholder');

  // El textarea crece con el contenido hasta 3 líneas (el máximo lo pone el CSS)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const submit = async () => {
    const text = value.trim();
    if (!text || sending) return; // evita mensajes vacíos y doble envío
    setSending(true);
    try {
      await onSend(text);
      setValue(''); // solo se borra si se envió: si falla, no se pierde lo escrito
    } catch {
      /* el error lo muestra la página */
    } finally {
      setSending(false);
      ref.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={styles.field}>
      <textarea
        ref={ref}
        className={styles.input}
        rows={1}
        value={value}
        placeholder={inputPlaceholder}
        aria-label={t('message_input.aria_label')}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={1000}
      />
      <button
        type="button"
        className={styles.send}
        onClick={submit}
        disabled={!value.trim() || sending}
        aria-label={t('message_input.send_aria')}
      >
        {sending
          ? <span className={styles.spinner} aria-hidden="true" />
          : <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>}
      </button>
    </div>
  );
}
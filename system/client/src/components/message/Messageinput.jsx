import { useLayoutEffect, useRef, useState } from 'react'
import styles from './MessageInput.module.css'

export default function MessageInput({ onSend }) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const ref = useRef(null)

  // Se eligió <textarea> (y no <input>) porque un input no puede tener varias líneas.
  // Ajustamos la altura en useLayoutEffect (antes de que el navegador pinte) para que
  // no haya un parpadeo. Depende de `value`, así que también se achica solo cuando
  // el texto se borra después de enviar.
  useLayoutEffect(() => {
    const el = ref.current
    el.style.height = 'auto' // primero se resetea para poder medir también cuando se borra texto
    // offsetHeight - clientHeight = grosor de los bordes; hay que sumarlo porque
    // usamos box-sizing: border-box y si no, siempre sobraría un scroll de 4px.
    el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`
    // El tope de 3 líneas lo pone `max-height` en el CSS; pasado ese punto,
    // overflow-y: auto muestra la scrollbar solo.
  }, [value])

  const submit = async () => {
    const text = value.trim()
    if (!text || sending) return // evita mensajes vacíos y doble envío con Enter repetido
    setSending(true)
    try {
      await onSend(text)
      setValue('') // solo se borra si el envío salió bien: si falla, no se pierde lo escrito
    } catch {
      /* el error lo muestra la página */
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    // Como el diseño no tiene botón de enviar, Enter envía y Shift+Enter hace salto de línea
    // (es la convención de WhatsApp/Discord). isComposing evita enviar a mitad de una
    // composición de teclados IME (acentos, japonés, etc.).
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <textarea
      ref={ref}
      className={styles.input}
      rows={1}
      value={value}
      placeholder="Escribe un mensaje..."
      aria-label="Escribe un mensaje"
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  )
}
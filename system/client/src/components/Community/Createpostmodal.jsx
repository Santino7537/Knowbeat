import { useState } from 'react';
import styles from './CreatePostModal.module.css';

const TITLE_MAX_LENGTH = 100;
const TEXT_MAX_LENGTH = 1000;

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]); // acá guardamos la lista de etiquetas
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Estados puntuales para pintar de rojo el borde del título y/o el
  // cuerpo cuando el usuario intentó publicar dejándolos vacíos.
  // Se limpian recién cuando el usuario vuelve a hacer foco en ese campo
  // (no con cada tecla que escribe), tal como pediste.
  const [titleError, setTitleError] = useState(false);
  const [textError, setTextError] = useState(false);

  // Si el modal está cerrado, no renderizamos nada.
  // Lo ponemos después de los hooks para no romper las reglas de React.
  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setText('');
    setTagInput('');
    setTags([]);
    setError('');
    setTitleError(false);
    setTextError(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Al hacer click en el fondo oscuro (fuera del modal) también cerramos,
  // pero si el click es dentro del modal, cortamos la propagación
  // para que no se dispare el cierre.
  const handleOverlayClick = () => {
    handleClose();
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Al presionar Enter en el campo de etiquetas, la palabra escrita
  // se agrega a la lista de tags y se limpia el input.
  const handleTagKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); // evita que el Enter mande el formulario o salte de línea

    const newTag = tagInput.trim();
    if (newTag.length === 0) return;

    // Evitamos etiquetas duplicadas (comparando sin importar mayúsculas)
    const alreadyExists = tags.some(
      (t) => t.toLowerCase() === newTag.toLowerCase()
    );
    if (!alreadyExists) {
      setTags((prev) => [...prev, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handlePublish = async () => {
    const isTitleEmpty = title.trim().length === 0;
    const isTextEmpty = text.trim().length === 0;

    // Validación mínima antes de pegarle al endpoint.
    // Marcamos con borde rojo solo el/los campos que están vacíos.
    if (isTitleEmpty || isTextEmpty) {
      setTitleError(isTitleEmpty);
      setTextError(isTextEmpty);
      setError('El título y el cuerpo no pueden estar vacíos.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/community/create/thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Uso credentials: 'include' asumiendo que el token/sesión viaja
        // en una cookie (por eso pasa por checkToken/isAuth en el backend).
        // Si en tu proyecto el token va en un header Authorization en vez
        // de en una cookie, avisame y lo agregamos acá.
        credentials: 'include',
        body: JSON.stringify({ title, text, tags }),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear la publicación.');
      }

      const data = await response.json();

      onPostCreated?.(data); // por si la página padre quiere refrescar el feed
      resetForm();
      onClose();
    } catch (err) {
      setError('Ocurrió un error al publicar. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={handleModalClick}>
        <div className={styles.header}>
          <h2 className={styles.title}>Crea una publicación</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Cerrar"
          >
            X
          </button>
        </div>

        <div className={styles.body}>
          {/* Título */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="postTitle">
              Título
            </label>
            <input
              id="postTitle"
              type="text"
              className={
                titleError
                  ? `${styles.input} ${styles.inputErrorBorder}`
                  : styles.input
              }
              placeholder="Pon un titular"
              maxLength={TITLE_MAX_LENGTH}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setTitleError(false)}
            />
            <span className={styles.charCount}>
              {title.length}/{TITLE_MAX_LENGTH}
            </span>
          </div>

          {/* Cuerpo */}
          <div className={`${styles.field} ${styles.bodyField}`}>
            <label className={styles.label} htmlFor="postBody">
              Cuerpo
            </label>
            <textarea
              id="postBody"
              className={
                textError
                  ? `${styles.textarea} ${styles.inputErrorBorder}`
                  : styles.textarea
              }
              placeholder="Escribe algo..."
              maxLength={TEXT_MAX_LENGTH}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setTextError(false)}
            />
            <span className={styles.charCount}>
              {text.length}/{TEXT_MAX_LENGTH}
            </span>
          </div>

          {/* Etiquetas + botón de publicar */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="postTags">
              Etiquetas
            </label>
            <div className={styles.tagsRow}>
              <div className={styles.tagsField}>
                {tags.map((tag, index) => (
                  <span key={`${tag}-${index}`} className={styles.tagChip}>
                    {tag}
                    <button
                      type="button"
                      className={styles.tagRemoveButton}
                      onClick={() => handleRemoveTag(index)}
                      aria-label={`Quitar etiqueta ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="postTags"
                  type="text"
                  className={styles.tagInput}
                  placeholder={tags.length === 0 ? 'Agrega una etiqueta' : ''}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
              </div>

              <button
                type="button"
                className={styles.publishButton}
                onClick={handlePublish}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>

          {/*
            Renderizamos este <p> siempre (tenga o no texto), para que
            el espacio que ocupa ya esté contemplado en el reparto de
            alto del modal. Así, cuando aparece un error, no cambia
            la altura total del contenido y no se dispara la scrollbar.
          */}
          <p className={styles.errorText} aria-live="polite">
            {error}
          </p>
        </div>
      </div>
    </div>
  );
}
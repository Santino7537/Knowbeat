import { useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Avatar from '../general/Avatar.jsx';
import styles from './Createpostmodal.module.css';

const TITLE_MAX_LENGTH = 100;
const TEXT_MAX_LENGTH = 1000;
const MAX_TAGS = 5;

// Tipos de publicación: ayudan a arrancar y agregan su etiqueta automáticamente
export const POST_KINDS = [
  { id: 'pregunta', label: 'Pregunta', placeholder: '¿Qué te gustaría saber?' },
  { id: 'logro', label: 'Logro', placeholder: '¿Qué conseguiste hoy?' },
  { id: 'consejo', label: 'Consejo', placeholder: 'Compartí un truco que te sirvió' },
  { id: 'recurso', label: 'Recurso', placeholder: 'Una partitura, un video, un ejercicio…' },
];

const SUGGESTED_TAGS = ['Guitarra', 'Piano', 'Teoría', 'Armonía', 'Acordes', 'Escalas', 'Ritmo', 'Canto'];

export default function CreatePostModal({ isOpen, onClose, onPostCreated, initialKind = null }) {
  const { loggedUser } = useAuth();
  const toast = useToast();

  const [kind, setKind] = useState(initialKind);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const titleRef = useRef(null);
  const textRef = useRef(null);

  // Al abrir: tipo inicial, foco en el título, bloqueo del scroll de fondo
  useEffect(() => {
    if (!isOpen) return undefined;
    setKind(initialKind);
    if (initialKind) {
      const k = POST_KINDS.find((item) => item.id === initialKind);
      if (k) setTags((prev) => (prev.includes(k.label) ? prev : [k.label, ...prev]));
    }
    const t = setTimeout(() => titleRef.current?.focus(), 60);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, initialKind]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!isOpen) return null;

  const resetForm = () => {
    setKind(null);
    setTitle('');
    setText('');
    setTagInput('');
    setTags([]);
    setErrors({});
    setGeneralError('');
  };

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: undefined }));

  const addTag = (raw) => {
    const newTag = raw.trim().replace(/^#/, '').slice(0, 30);
    if (!newTag) return;
    if (tags.length >= MAX_TAGS) {
      setErrors((prev) => ({ ...prev, tags: `Podés agregar hasta ${MAX_TAGS} etiquetas.` }));
      return;
    }
    if (!tags.some((t) => t.toLowerCase() === newTag.toLowerCase())) {
      setTags((prev) => [...prev, newTag]);
    }
    clearError('tags');
  };

  const removeTag = (tagToRemove) => setTags((prev) => prev.filter((t) => t !== tagToRemove));

  const selectKind = (k) => {
    // Cambiar de tipo reemplaza la etiqueta del tipo anterior
    const previous = POST_KINDS.find((item) => item.id === kind);
    setTags((prev) => {
      const withoutPrevious = previous ? prev.filter((t) => t !== previous.label) : prev;
      if (kind === k.id) return withoutPrevious;
      return withoutPrevious.includes(k.label) ? withoutPrevious : [k.label, ...withoutPrevious];
    });
    setKind(kind === k.id ? null : k.id);
    clearError('tags');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 320)}px`;
  };

  const validate = () => {
    const next = {};
    if (!title.trim()) next.title = 'Poné un título para que otros sepan de qué trata.';
    if (!text.trim()) next.text = 'Contanos un poco más en el cuerpo de la publicación.';
    // Lo que esté escrito en el campo de etiquetas también cuenta
    const pending = tagInput.trim();
    if (tags.length === 0 && !pending) next.tags = 'Agregá al menos una etiqueta (por ejemplo, Guitarra).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePublish = async () => {
    setGeneralError('');
    if (!validate()) return;

    const finalTags = [...tags];
    const pending = tagInput.trim();
    if (pending && !finalTags.some((t) => t.toLowerCase() === pending.toLowerCase())) finalTags.push(pending);

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/community/create/thread', {
        title: title.trim(),
        text: text.trim(),
        tags: finalTags,
      });
      toast.success('¡Listo! Tu publicación ya está en la comunidad.');
      onPostCreated?.(data);
      resetForm();
      onClose();
    } catch (error) {
      setGeneralError(getErrorMessage(error, 'No se pudo publicar. Probá de nuevo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePublish();
    }
  };

  const currentKind = POST_KINDS.find((k) => k.id === kind);
  const username = loggedUser?.username ?? 'vos';
  const suggestions = SUGGESTED_TAGS.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())).slice(0, 6);

  return (
    <div className={styles.overlay} onMouseDown={handleClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="createPostTitle"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleFormKeyDown}
      >
        <header className={styles.header}>
          <div className={styles.headerUser}>
            <Avatar name={username} src={loggedUser?.picture} size={42} />
            <div>
              <h2 id="createPostTitle" className={styles.title}>Nueva publicación</h2>
              <p className={styles.subtitle}>Publicás como <strong>{username}</strong></p>
            </div>
          </div>
          <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          {/* Tipo de publicación */}
          <div className={styles.kinds} role="group" aria-label="Tipo de publicación">
            {POST_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                className={`${styles.kind} ${kind === k.id ? styles.kindActive : ''}`}
                onClick={() => selectKind(k)}
                aria-pressed={kind === k.id}
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Título */}
          <div className={styles.field}>
            <input
              ref={titleRef}
              id="postTitle"
              type="text"
              className={`${styles.titleInput} ${errors.title ? styles.invalid : ''}`}
              placeholder={currentKind?.placeholder ?? 'Escribí un título'}
              maxLength={TITLE_MAX_LENGTH}
              value={title}
              onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
              aria-label="Título"
              aria-invalid={Boolean(errors.title)}
            />
            <div className={styles.fieldFoot}>
              <span className={styles.fieldError} role="alert">{errors.title}</span>
              <span className={styles.charCount}>{title.length}/{TITLE_MAX_LENGTH}</span>
            </div>
          </div>

          {/* Cuerpo */}
          <div className={styles.field}>
            <textarea
              ref={textRef}
              id="postBody"
              className={`${styles.textarea} ${errors.text ? styles.invalid : ''}`}
              placeholder="Contá con detalle: qué estás practicando, qué te trabó, qué descubriste…"
              maxLength={TEXT_MAX_LENGTH}
              value={text}
              onChange={(e) => { handleTextChange(e); clearError('text'); }}
              aria-label="Cuerpo de la publicación"
              aria-invalid={Boolean(errors.text)}
              rows={5}
            />
            <div className={styles.fieldFoot}>
              <span className={styles.fieldError} role="alert">{errors.text}</span>
              <span className={`${styles.charCount} ${text.length > TEXT_MAX_LENGTH * 0.9 ? styles.charWarn : ''}`}>
                {text.length}/{TEXT_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Etiquetas */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="postTags">Etiquetas</label>
            <div className={`${styles.tagsField} ${errors.tags ? styles.invalid : ''}`} onClick={() => document.getElementById('postTags')?.focus()}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  #{tag}
                  <button type="button" className={styles.tagRemoveButton} onClick={() => removeTag(tag)} aria-label={`Quitar etiqueta ${tag}`}>×</button>
                </span>
              ))}
              <input
                id="postTags"
                type="text"
                className={styles.tagInput}
                placeholder={tags.length === 0 ? 'Escribí y apretá Enter' : ''}
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); clearError('tags'); }}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(''); } }}
              />
            </div>
            {suggestions.length > 0 && tags.length < MAX_TAGS && (
              <div className={styles.suggestions}>
                <span>Sugeridas:</span>
                {suggestions.map((s) => (
                  <button key={s} type="button" className={styles.suggestion} onClick={() => addTag(s)}>+ {s}</button>
                ))}
              </div>
            )}
            <span className={styles.fieldError} role="alert">{errors.tags}</span>
          </div>

          {generalError && (
            <div className={styles.generalError} role="alert">
              <strong>No se pudo publicar.</strong> {generalError}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <span className={styles.hint}><kbd>Ctrl</kbd> + <kbd>Enter</kbd> para publicar</span>
          <div className={styles.footerActions}>
            <button type="button" className={styles.cancelButton} onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="button" className={styles.publishButton} onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
              {isSubmitting ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

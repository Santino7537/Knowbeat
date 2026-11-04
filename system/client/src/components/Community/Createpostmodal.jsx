import { useEffect, useRef, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx'; // <-- Importar hook de idioma
import Avatar from '../general/Avatar.jsx';
import styles from './Createpostmodal.module.css';

const TITLE_MAX_LENGTH = 100;
const TEXT_MAX_LENGTH = 1000;
const MAX_TAGS = 5;

export const POST_KINDS = [
  { id: 'pregunta', labelKey: 'community_modal.kinds.pregunta', placeholderKey: 'community_modal.placeholders.pregunta' },
  { id: 'logro', labelKey: 'community_modal.kinds.logro', placeholderKey: 'community_modal.placeholders.logro' },
  { id: 'consejo', labelKey: 'community_modal.kinds.consejo', placeholderKey: 'community_modal.placeholders.consejo' },
  { id: 'recurso', labelKey: 'community_modal.kinds.recurso', placeholderKey: 'community_modal.placeholders.recurso' },
];

const SUGGESTED_TAGS = ['Guitarra', 'Piano', 'Teoría', 'Armonía', 'Acordes', 'Escalas', 'Ritmo', 'Canto'];

export default function CreatePostModal({ isOpen, onClose, onPostCreated, initialKind = null }) {
  const { loggedUser } = useAuth();
  const toast = useToast();
  const { t } = useLanguage(); // <-- Consumir la función de traducción

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

  useEffect(() => {
    if (!isOpen) return undefined;
    setKind(initialKind);
    if (initialKind) {
      const k = POST_KINDS.find((item) => item.id === initialKind);
      if (k) {
        const label = t(k.labelKey);
        setTags((prev) => (prev.includes(label) ? prev : [label, ...prev]));
      }
    }
    const timeoutId = setTimeout(() => titleRef.current?.focus(), 60);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timeoutId);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, initialKind, t]);

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
      setErrors((prev) => ({ ...prev, tags: t('community_modal.errors.max_tags').replace('{max}', MAX_TAGS) }));
      return;
    }
    if (!tags.some((item) => item.toLowerCase() === newTag.toLowerCase())) {
      setTags((prev) => [...prev, newTag]);
    }
    clearError('tags');
  };

  const removeTag = (tagToRemove) => setTags((prev) => prev.filter((item) => item !== tagToRemove));

  const selectKind = (k) => {
    const previous = POST_KINDS.find((item) => item.id === kind);
    const prevLabel = previous ? t(previous.labelKey) : '';
    const currentLabel = t(k.labelKey);

    setTags((prev) => {
      const withoutPrevious = previous ? prev.filter((item) => item !== prevLabel) : prev;
      if (kind === k.id) return withoutPrevious;
      return withoutPrevious.includes(currentLabel) ? withoutPrevious : [currentLabel, ...withoutPrevious];
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
    if (!title.trim()) next.title = t('community_modal.errors.title_required');
    if (!text.trim()) next.text = t('community_modal.errors.text_required');
    const pending = tagInput.trim();
    if (tags.length === 0 && !pending) next.tags = t('community_modal.errors.tags_required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePublish = async () => {
    setGeneralError('');
    if (!validate()) return;

    const finalTags = [...tags];
    const pending = tagInput.trim();
    if (pending && !finalTags.some((item) => item.toLowerCase() === pending.toLowerCase())) finalTags.push(pending);

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/community/create/thread', {
        title: title.trim(),
        text: text.trim(),
        tags: finalTags,
      });
      toast.success(t('community_modal.success_toast'));
      onPostCreated?.(data);
      resetForm();
      onClose();
    } catch (error) {
      setGeneralError(getErrorMessage(error, t('community_modal.errors.publish_failed')));
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
  const username = loggedUser?.username ?? t('community_modal.default_user');
  const suggestions = SUGGESTED_TAGS.filter((s) => !tags.some((item) => item.toLowerCase() === s.toLowerCase())).slice(0, 6);

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
              <h2 id="createPostTitle" className={styles.title}>{t('community_modal.title')}</h2>
              <p className={styles.subtitle}>{t('community_modal.posting_as')} <strong>{username}</strong></p>
            </div>
          </div>
          <button type="button" className={styles.closeButton} onClick={handleClose} aria-label={t('community_modal.close_aria')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          {/* Tipo de publicación */}
          <div className={styles.kinds} role="group" aria-label={t('community_modal.kinds_aria')}>
            {POST_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                className={`${styles.kind} ${kind === k.id ? styles.kindActive : ''}`}
                onClick={() => selectKind(k)}
                aria-pressed={kind === k.id}
              >
                {t(k.labelKey)}
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
              placeholder={currentKind ? t(currentKind.placeholderKey) : t('community_modal.default_title_placeholder')}
              maxLength={TITLE_MAX_LENGTH}
              value={title}
              onChange={(e) => { setTitle(e.target.value); clearError('title'); }}
              aria-label={t('community_modal.title_aria')}
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
              placeholder={t('community_modal.text_placeholder')}
              maxLength={TEXT_MAX_LENGTH}
              value={text}
              onChange={(e) => { handleTextChange(e); clearError('text'); }}
              aria-label={t('community_modal.text_aria')}
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
            <label className={styles.label} htmlFor="postTags">{t('community_modal.tags_label')}</label>
            <div className={`${styles.tagsField} ${errors.tags ? styles.invalid : ''}`} onClick={() => document.getElementById('postTags')?.focus()}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  #{tag}
                  <button type="button" className={styles.tagRemoveButton} onClick={() => removeTag(tag)} aria-label={`${t('community_modal.remove_tag_aria')} ${tag}`}>×</button>
                </span>
              ))}
              <input
                id="postTags"
                type="text"
                className={styles.tagInput}
                placeholder={tags.length === 0 ? t('community_modal.tag_input_placeholder') : ''}
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); clearError('tags'); }}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(''); } }}
              />
            </div>
            {suggestions.length > 0 && tags.length < MAX_TAGS && (
              <div className={styles.suggestions}>
                <span>{t('community_modal.suggested_label')}</span>
                {suggestions.map((s) => (
                  <button key={s} type="button" className={styles.suggestion} onClick={() => addTag(s)}>+ {s}</button>
                ))}
              </div>
            )}
            <span className={styles.fieldError} role="alert">{errors.tags}</span>
          </div>

          {generalError && (
            <div className={styles.generalError} role="alert">
              <strong>{t('community_modal.errors.general_bold')}</strong> {generalError}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <span className={styles.hint}><kbd>Ctrl</kbd> + <kbd>Enter</kbd> {t('community_modal.hint_publish')}</span>
          <div className={styles.footerActions}>
            <button type="button" className={styles.cancelButton} onClick={handleClose} disabled={isSubmitting}>
              {t('community_modal.cancel_btn')}
            </button>
            <button type="button" className={styles.publishButton} onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
              {isSubmitting ? t('community_modal.publishing_btn') : t('community_modal.publish_btn')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
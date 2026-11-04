import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx'; // <-- Importar hook de idioma
import styles from './Filterpanel.module.css';

const POPULAR_TAGS = ['Guitarra', 'Piano', 'Teoría', 'Armonía', 'Acordes', 'Escalas', 'Ritmo', 'Dudas'];

export default function FilterPanel({
  typeOptions,
  visibleTypes,
  onToggleType,
  tags,
  onTagsChange,
}) {
  const { t } = useLanguage(); // <-- Consumir la función de traducción
  const [tagInput, setTagInput] = useState('');

  const handleTagKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const newTag = tagInput.trim();
    if (newTag.length === 0) return;

    const alreadyExists = tags.some(
      (tag) => tag.toLowerCase() === newTag.toLowerCase()
    );
    if (!alreadyExists) onTagsChange([...tags, newTag]);
    setTagInput('');
  };

  const handleRemoveTag = (indexToRemove) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.inner}>
        <h2 className={styles.title}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>
          {t('filter_panel.title')}
        </h2>

        {/* Qué tipos de contenido se muestran en la página */}
        <h3 className={styles.subtitle} id="filterVisibleTitle">
          {t('filter_panel.show_title')}
        </h3>
        <div
          className={styles.options}
          role="group"
          aria-labelledby="filterVisibleTitle"
        >
          {typeOptions.map((option) => {
            const isChecked = visibleTypes.includes(option.value);

            return (
              <label key={option.value} className={styles.option}>
                <span className={styles.optionLabel}>{option.label}</span>

                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={isChecked}
                  onChange={() => onToggleType(option.value)}
                />
                <span
                  className={
                    isChecked
                      ? `${styles.checkbox} ${styles.checkboxChecked}`
                      : styles.checkbox
                  }
                  aria-hidden="true"
                >
                  {isChecked && (
                    <svg
                      className={styles.checkIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="4 12 10 18 20 6" />
                    </svg>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        {/* Etiquetas */}
        <label className={`${styles.subtitle} ${styles.tagsTitle}`} htmlFor="filterTagInput">
          {t('filter_panel.tags_title')}
        </label>
        <div className={styles.tagsField}>
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className={styles.tagChip}>
              <span className={styles.tagText}>{tag}</span>
              <button
                type="button"
                className={styles.tagRemoveButton}
                onClick={() => handleRemoveTag(index)}
                aria-label={`${t('filter_panel.remove_tag_aria')} ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            id="filterTagInput"
            type="text"
            className={styles.tagInput}
            placeholder={tags.length === 0 ? t('filter_panel.tag_input_placeholder') : ''}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
        </div>

        {/* Etiquetas populares */}
        <h3 className={styles.subtitle}>{t('filter_panel.popular_title')}</h3>
        <div className={styles.popular}>
          {POPULAR_TAGS.map((tag) => {
            const active = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                className={`${styles.popularTag} ${active ? styles.popularTagActive : ''}`}
                aria-pressed={active}
                onClick={() => onTagsChange(active
                  ? tags.filter((t) => t.toLowerCase() !== tag.toLowerCase())
                  : [...tags, tag])}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
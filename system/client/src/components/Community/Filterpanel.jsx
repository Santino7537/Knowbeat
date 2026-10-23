import { useState } from 'react';
import styles from './FilterPanel.module.css';

/*
  Panel de filtros (controlado: el estado vive en la página, porque la página
  es quien lo necesita para pedir los datos al backend).

  Props:
  - typeOptions: [{ value, label }] los tipos de contenido que se pueden mostrar
  - visibleTypes: array con los `value` marcados
  - onToggleType(value): se llama al marcar/desmarcar un tipo
  - tags: array de etiquetas activas
  - onTagsChange(nextTags): se llama al agregar o quitar una etiqueta
*/
export default function FilterPanel({
  typeOptions,
  visibleTypes,
  onToggleType,
  tags,
  onTagsChange,
}) {
  // Lo que el usuario está escribiendo en el campo de etiquetas.
  // Es local porque a la página solo le importan las etiquetas ya confirmadas.
  const [tagInput, setTagInput] = useState('');

  // Igual que en el modal de crear publicación: al presionar Enter, lo
  // escrito se convierte en una etiqueta (sin duplicados, sin importar mayúsculas).
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
        <h2 className={styles.title}>Filtros</h2>

        {/* Qué tipos de contenido se muestran en la página */}
        <h3 className={styles.subtitle} id="filterVisibleTitle">
          Contenido Visible
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

                {/*
                  El <input> real está oculto pero sigue siendo el que recibe
                  el foco y el teclado (accesible). El cuadrado que se ve es
                  el <span> siguiente, que se pinta según el estado.
                */}
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

        {/* Etiquetas: mismo funcionamiento que en el modal de crear publicación */}
        <label className={`${styles.subtitle} ${styles.tagsTitle}`} htmlFor="filterTagInput">
          Etiquetas
        </label>
        <div className={styles.tagsField}>
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className={styles.tagChip}>
              <span className={styles.tagText}>{tag}</span>
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
            id="filterTagInput"
            type="text"
            className={styles.tagInput}
            placeholder={tags.length === 0 ? 'Agrega una etiqueta' : ''}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
        </div>
      </div>
    </aside>
  );
}
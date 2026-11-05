import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import { EXERCISE_TYPES, exercisesCatalog } from '../exercises-pages/exercisesCatalog';
import styles from './CSS/Exercises.module.css';
import { useLanguage } from '../context/LanguageContext.jsx'; // <-- Importar hook de idioma

const Exercises = () => {
  const navigate = useNavigate();
  const { t } = useLanguage(); // <-- Consumir la función de traducción
  const [activeType, setActiveType] = useState('Todos');

  const filteredExercises = useMemo(() => {
    if (activeType === 'Todos') {
      return exercisesCatalog;
    }

    return exercisesCatalog.filter(
      (exercise) => exercise.type === activeType
    );
  }, [activeType]);

  const availableCount = exercisesCatalog.filter(
    (exercise) => exercise.available
  ).length;

  return (
    <div className={styles.exercises_layout}>
      <Sidebar />

      <main className={styles.exercises_main}>
        <div className={styles.exercises_header}>
          <div>
            <h1>{t('exercises_page.title')}</h1>
            <p>
              {t('exercises_page.subtitle')}
            </p>
          </div>

          <div className={styles.header_stats}>
            <span className={styles.stat_pill}>
              {availableCount} {availableCount !== 1 ? t('exercises_page.stats.available_plural') : t('exercises_page.stats.available_singular')}
            </span>
          </div>
        </div>

        <div className={styles.content_container}>
          <aside className={styles.types_panel}>
            <h3>{t('exercises_page.filter_title')}</h3>

            {EXERCISE_TYPES.map((type) => {
              const count =
                type === 'Todos'
                  ? exercisesCatalog.length
                  : exercisesCatalog.filter(
                      (exercise) => exercise.type === type
                    ).length;

              // Manejar etiqueta para el botón "Todos" de forma localizada si es necesario
              const displayLabel = type === 'Todos' ? t('exercises_page.all_types') : type;

              return (
                <button
                  key={type}
                  type="button"
                  className={`${styles.type_button} ${
                    activeType === type ? styles.type_button_active : ''
                  }`}
                  onClick={() => setActiveType(type)}
                >
                  <span>{displayLabel}</span>
                  <span className={styles.type_count}>{count}</span>
                </button>
              );
            })}
          </aside>

          <section className={styles.exercises_panel}>
            <div className={styles.panel_header}>
              <h2>
                {activeType === 'Todos'
                  ? t('exercises_page.all_exercises')
                  : t('exercises_page.exercises_of').replace('{type}', activeType)}
              </h2>
            </div>

            {filteredExercises.length === 0 ? (
              <div className={styles.empty_state}>
                <span className={styles.empty_icon}>🎼</span>
                <h3>{t('exercises_page.empty.title')}</h3>
                <p>
                  {t('exercises_page.empty.desc')}
                </p>
                <button
                  type="button"
                  className={styles.reset_filter_button}
                  onClick={() => setActiveType('Todos')}
                >
                  {t('exercises_page.empty.reset_btn')}
                </button>
              </div>
            ) : (
              <div className={styles.exercises_grid}>
                {filteredExercises.map((exercise) => (
                  <article
                    key={exercise.id}
                    className={`${styles.exercise_card} ${
                      exercise.available
                        ? styles.exercise_card_clickable
                        : styles.exercise_card_disabled
                    }`}
                    onClick={() => {
                      if (exercise.available) {
                        navigate(exercise.path);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (
                        exercise.available &&
                        (event.key === 'Enter' || event.key === ' ')
                      ) {
                        event.preventDefault();
                        navigate(exercise.path);
                      }
                    }}
                    role={exercise.available ? 'button' : undefined}
                    tabIndex={exercise.available ? 0 : -1}
                  >
                    <div className={styles.card_top}>
                      <span className={styles.type_badge}>
                        {exercise.type}
                      </span>
                      {!exercise.available && (
                        <span className={styles.coming_soon_badge}>
                          {t('exercises_page.coming_soon')}
                        </span>
                      )}
                    </div>

                    <h3>{exercise.title}</h3>
                    <p>{exercise.description}</p>

                    {exercise.available && (
                      <span className={styles.enter_link}>
                        {t('exercises_page.start_link')}
                      </span>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Exercises;
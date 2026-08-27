import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Sidebar from '../components/Sidebar'
import { EXERCISE_TYPES, exercisesCatalog } from '../exercises-pages/exercisesCatalog'
import styles from './CSS/Exercises.module.css'

const Exercises = () => {
  const navigate = useNavigate()
  const [activeType, setActiveType] = useState('Todos')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const settings = user?.configuration || user
  const isLightMode = settings?.appearance?.dark_mode === false

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }

    return () => document.body.classList.remove('light-mode')
  }, [isLightMode])

  const filteredExercises = useMemo(() => {
    if (activeType === 'Todos') {
      return exercisesCatalog
    }

    return exercisesCatalog.filter(
      (exercise) => exercise.type === activeType
    )
  }, [activeType])

  const availableCount = exercisesCatalog.filter(
    (exercise) => exercise.available
  ).length

  return (
    <div className={`${styles.exercises_layout} ${
      isLightMode ? styles.light_mode : ''
    }`}>
      <Sidebar />

      <main className={styles.exercises_main}>
        <div className={styles.exercises_header}>
          <div>
            <h1>Ejercicios Musicales</h1>
            <p>
              Elegí un tipo de ejercicio y empezá a practicar.
            </p>
          </div>

          <div className={styles.header_stats}>
            <span className={styles.stat_pill}>
              {availableCount} disponible{availableCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className={styles.content_container}>
          <aside className={styles.types_panel}>
            <h3>Filtrar por tipo</h3>

            {EXERCISE_TYPES.map((type) => {
              const count =
                type === 'Todos'
                  ? exercisesCatalog.length
                  : exercisesCatalog.filter(
                      (exercise) => exercise.type === type
                    ).length

              return (
                <button
                  key={type}
                  type="button"
                  className={`${styles.type_button} ${
                    activeType === type ? styles.type_button_active : ''
                  }`}
                  onClick={() => setActiveType(type)}
                >
                  <span>{type}</span>
                  <span className={styles.type_count}>{count}</span>
                </button>
              )
            })}
          </aside>

          <section className={styles.exercises_panel}>
            <div className={styles.panel_header}>
              <h2>
                {activeType === 'Todos'
                  ? 'Todos los ejercicios'
                  : `Ejercicios de ${activeType}`}
              </h2>
            
            </div>

            {filteredExercises.length === 0 ? (
              <div className={styles.empty_state}>
                <span className={styles.empty_icon}>🎼</span>
                <h3>Sin ejercicios por ahora</h3>
                <p>
                  Probá con otra categoría o volvé más adelante cuando
                  agreguemos nuevos ejercicios.
                </p>
                <button
                  type="button"
                  className={styles.reset_filter_button}
                  onClick={() => setActiveType('Todos')}
                >
                  Ver todos los ejercicios
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
                        navigate(exercise.path)
                      }
                    }}
                    onKeyDown={(event) => {
                      if (
                        exercise.available &&
                        (event.key === 'Enter' || event.key === ' ')
                      ) {
                        event.preventDefault()
                        navigate(exercise.path)
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
                          Próximamente
                        </span>
                      )}
                    </div>

                    <h3>{exercise.title}</h3>
                    <p>{exercise.description}</p>

                    {exercise.available && (
                      <span className={styles.enter_link}>
                        Empezar →
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
  )
}

export default Exercises

import styles from "./CourseLessonMap.module.css";

const statusLabels = {
  completed: "Completada",
  available: "Actual",
  locked: "Bloqueada"
};

const LessonDetailsSidebar = ({ lesson, lessonNumber, onClose, onStartLesson, startingLesson }) => {
  if (!lesson) return null;

  const isLocked = lesson.status === "locked";
  const isAvailable = lesson.status === "available";

  return (
    <>
      <button
        className={styles.panelBackdrop}
        type="button"
        aria-label="Cerrar información de la lección"
        onClick={onClose}
      />
      <aside className={styles.detailsPanel} aria-labelledby="lesson-details-title">
        <header className={styles.panelHeader}>
          <span className={styles.panelEyebrow}>LECCIÓN {lessonNumber}</span>
          <button className={styles.closeButton} type="button" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <h2 id="lesson-details-title">{lesson.title}</h2>
        <p className={styles.lessonDescription}>{lesson.description}</p>

        <dl className={styles.lessonMetadata}>
          <div>
            <dt>Tipo</dt>
            <dd>{lesson.type}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd className={`${styles.statusValue} ${styles[lesson.status]}`}>
              {statusLabels[lesson.status]}
            </dd>
          </div>
        </dl>

        {isLocked && (
          <p className={styles.lockedHint}>Completá las lecciones anteriores para continuar.</p>
        )}
        <button
          className={styles.startButton}
          type="button"
          disabled={!isAvailable || startingLesson}
          onClick={onStartLesson}
        >
          {startingLesson
            ? "Iniciando..."
            : isAvailable
              ? "Iniciar lección"
              : isLocked
                ? "Lección bloqueada"
                : "Lección completada"}
        </button>
      </aside>
    </>
  );
};

export default LessonDetailsSidebar;
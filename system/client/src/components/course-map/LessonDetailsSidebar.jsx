import styles from "./CourseLessonMap.module.css";

const statusLabels = {
  completed: "Completada",
  available: "Actual",
  locked: "Bloqueada"
};

const levelLabels = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado"
};

const formatSection = (sectionId) => sectionId
  .split(/[-_]/)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ");

const LessonDetailsSidebar = ({ lesson, lessonNumber, onClose, onStartLesson, startingLesson }) => {
  if (!lesson) return null;

  const isLocked = lesson.status === "locked";
  const isAvailable = lesson.status === "available";
  const isCompleted = lesson.status === "completed";
  const hasContent = lesson.hasContent !== false;

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
          {lesson.sectionId && (
            <div>
              <dt>Sección</dt>
              <dd>{formatSection(lesson.sectionId)}</dd>
            </div>
          )}
          {lesson.level && (
            <div>
              <dt>Nivel</dt>
              <dd>{levelLabels[lesson.level] || formatSection(lesson.level)}</dd>
            </div>
          )}
          {Number.isSafeInteger(lesson.estimatedMinutes) && lesson.estimatedMinutes > 0 && (
            <div>
              <dt>Duración</dt>
              <dd>
                {lesson.estimatedMinutes} {lesson.estimatedMinutes === 1 ? "minuto" : "minutos"}
              </dd>
            </div>
          )}
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
        {isAvailable && !hasContent && (
          <p className={styles.lockedHint}>
            {lesson.contentError || "El contenido de esta lección todavía no está disponible."}
          </p>
        )}
        <button
          className={styles.startButton}
          type="button"
          disabled={isLocked || !hasContent || startingLesson}
          onClick={() => onStartLesson(lesson)}
        >
          {startingLesson
            ? "Iniciando..."
            : isAvailable
              ? hasContent
                ? "Iniciar lección"
                : "Contenido próximamente"
              : isCompleted
                ? hasContent
                  ? "Practicar nuevamente"
                  : "Contenido próximamente"
                : "Lección bloqueada"}
        </button>
      </aside>
    </>
  );
};

export default LessonDetailsSidebar;
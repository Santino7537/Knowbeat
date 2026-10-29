import styles from "./LessonPlayer.module.css";

const LessonCompletion = ({ result, isReplay = false, onRetry, onReturn }) => (
  <main className={styles.completion}>
    <p className={styles.eyebrow}>LECCIÓN FINALIZADA</p>
    <h1>{result.passed ? "¡Buen trabajo!" : "Seguí practicando"}</h1>
    {result.score && (
      <p className={styles.score}>
        Respuestas correctas: {result.score.correct} de {result.score.total}
        <strong>{result.score.percent}%</strong>
      </p>
    )}
    {result.passed ? (
      <p className={styles.completionMessage}>
        {isReplay
          ? "Terminaste la práctica. Tu progreso del curso se mantiene sin cambios."
          : "Aprobaste esta lección y tu progreso quedó guardado."}
      </p>
    ) : (
      <>
        <p className={styles.completionMessage}>Terminaste la lección, pero no alcanzaste el requisito para aprobarla.</p>
        <button className={styles.secondaryButton} type="button" onClick={onRetry}>
          Reintentar lección
        </button>
      </>
    )}
    <button className={styles.nextButton} type="button" onClick={onReturn}>
      Volver al curso
    </button>
  </main>
);

export default LessonCompletion;

import styles from "./LessonPlayer.module.css";
import { useLanguage } from "../../context/LanguageContext.jsx"; // <-- Importar hook de idioma (ajusta la ruta si es necesario)

const LessonCompletion = ({ result, isReplay = false, onRetry, onReturn }) => {
  const { t } = useLanguage(); // <-- Consumir la función de traducción

  return (
    <main className={styles.completion}>
      <p className={styles.eyebrow}>{t("lesson_completion.eyebrow")}</p>
      <h1>{result.passed ? t("lesson_completion.passed_title") : t("lesson_completion.failed_title")}</h1>
      {result.score && (
        <p className={styles.score}>
          {t("lesson_completion.correct_answers")} {result.score.correct} {t("lesson_completion.of")} {result.score.total}
          <strong>{result.score.percent}%</strong>
        </p>
      )}
      {result.passed ? (
        <p className={styles.completionMessage}>
          {isReplay
            ? t("lesson_completion.replay_message")
            : t("lesson_completion.passed_message")}
        </p>
      ) : (
        <>
          <p className={styles.completionMessage}>{t("lesson_completion.fail_message")}</p>
          <button className={styles.secondaryButton} type="button" onClick={onRetry}>
            {t("lesson_completion.retry_btn")}
          </button>
        </>
      )}
      <button className={styles.nextButton} type="button" onClick={onReturn}>
        {t("lesson_completion.return_btn")}
      </button>
    </main>
  );
};

export default LessonCompletion;
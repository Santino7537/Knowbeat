import { useRef, useState } from "react";
import LessonCompletion from "./LessonCompletion.jsx";
import SlideRenderer from "./SlideRenderer.jsx";
import styles from "./LessonPlayer.module.css";

const LessonPlayer = ({ lesson, lessonNumber, isReplay = false, onExit, onComplete }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [result, setResult] = useState(null);
  const savingRef = useRef(false);
  const slide = lesson.slides[slideIndex];
  const questionCount = lesson.slides.reduce(
    (total, currentSlide) => total + (currentSlide.type === "exercise" ? currentSlide.questions.length : 0),
    0
  );
  const submittedCount = Object.values(answers).filter((answer) => answer.submitted).length;
  const correctCount = Object.values(answers).filter((answer) => answer.submitted && answer.isCorrect).length;
  const isExerciseComplete = slide.type !== "exercise"
    || slide.questions.every((question) => answers[question.id]?.submitted);
  const isLastSlide = slideIndex === lesson.slides.length - 1;
  const progress = result ? 100 : Math.floor((slideIndex / lesson.slides.length) * 100);
  const score = questionCount > 0
    ? { correct: correctCount, total: questionCount, percent: Math.round((correctCount / questionCount) * 100) }
    : null;
  const lessonPassingScore = lesson.completion?.passingScore;
  const exercisePassingCriteria = lesson.slides
    .filter((currentSlide) => currentSlide.type === "exercise"
      && currentSlide.completion?.passingScore !== undefined);
  const passed = lessonPassingScore !== undefined
    ? correctCount >= lessonPassingScore
    : exercisePassingCriteria.every((exercise) => {
      const exerciseCorrectCount = exercise.questions.filter(
        (question) => answers[question.id]?.isCorrect
      ).length;
      return exerciseCorrectCount >= exercise.completion.passingScore;
    });

  const selectOption = (questionId, optionId) => {
    setAnswers((current) => {
      if (current[questionId]?.submitted) return current;
      return {
        ...current,
        [questionId]: { ...current[questionId], selectedOptionId: optionId }
      };
    });
  };

  const submitAnswer = (question) => {
    setAnswers((current) => {
      const answer = current[question.id];
      if (!answer?.selectedOptionId || answer.submitted) return current;
      return {
        ...current,
        [question.id]: {
          ...answer,
          submitted: true,
          isCorrect: answer.selectedOptionId === question.correctOptionId
        }
      };
    });
  };

  const finishLesson = async () => {
    if (savingRef.current || result) return;
    if (!passed) {
      setResult({ passed: false, score });
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      if (!isReplay) await onComplete(lessonNumber);
      setResult({ passed: true, score });
    } catch (error) {
      setSaveError(error.message || "No se pudo guardar el progreso. Intentá nuevamente.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const retryLesson = () => {
    setSlideIndex(0);
    setAnswers({});
    setResult(null);
    setSaveError("");
  };

  if (result) {
    return (
      <div className={styles.player}>
        <LessonCompletion
          result={result}
          isReplay={isReplay}
          onRetry={retryLesson}
          onReturn={onExit}
        />
      </div>
    );
  }

  const canAdvance = isExerciseComplete && !saving;

  return (
    <main className={styles.player}>
      <header className={styles.topBar}>
        <button className={styles.exitButton} type="button" onClick={onExit} aria-label="Salir de la lección">
          <span aria-hidden="true">×</span>
          <span>Salir</span>
        </button>
        <div className={styles.progressArea}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Progreso de la lección"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className={styles.lessonLabel}>Lección {lessonNumber}</span>
      </header>

      <section className={styles.lessonContent} aria-label={lesson.title}>
        <SlideRenderer
          key={slide.id}
          slide={slide}
          answers={answers}
          onSelectOption={selectOption}
          onSubmitAnswer={submitAnswer}
        />
      </section>

      <footer className={styles.navigation}>
        {slideIndex > 0 ? (
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={saving}
            onClick={() => setSlideIndex((index) => Math.max(0, index - 1))}
          >
            Anterior
          </button>
        ) : <span />}
        <div className={styles.navigationActions}>
          {saveError && (
            <p className={styles.saveError} role="alert">
              {saveError} {submittedCount > 0 && `Respuestas registradas: ${submittedCount}.`}
            </p>
          )}
          {isLastSlide ? (
            <button
              className={styles.nextButton}
              type="button"
              disabled={!canAdvance}
              onClick={finishLesson}
            >
              {saving ? "Guardando..." : saveError ? "Reintentar guardado" : "Finalizar lección"}
            </button>
          ) : (
            <button
              className={styles.nextButton}
              type="button"
              disabled={!canAdvance}
              onClick={() => setSlideIndex((index) => Math.min(lesson.slides.length - 1, index + 1))}
            >
              Siguiente
            </button>
          )}
        </div>
      </footer>
    </main>
  );
};

export default LessonPlayer;

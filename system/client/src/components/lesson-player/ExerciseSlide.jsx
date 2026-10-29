import styles from "./LessonPlayer.module.css";

const ExerciseSlide = ({ slide, answers, onSelectOption, onSubmitAnswer }) => (
  <article className={styles.exerciseSlide}>
    {slide.title && <h1 className={styles.slideTitle}>{slide.title}</h1>}
    {slide.description && <p className={styles.exerciseDescription}>{slide.description}</p>}
    <div className={styles.questions}>
      {slide.questions.map((question, questionIndex) => {
        const answer = answers[question.id];
        const submitted = Boolean(answer?.submitted);

        return (
          <section className={styles.question} key={question.id} aria-labelledby={`prompt-${question.id}`}>
            <h2 id={`prompt-${question.id}`} className={styles.questionPrompt}>
              <span className={styles.questionNumber}>{questionIndex + 1}</span>
              {question.prompt}
            </h2>
            <div className={styles.options}>
              {question.options.map((option) => (
                <button
                  className={`${styles.option} ${
                    answer?.selectedOptionId === option.id ? styles.selectedOption : ""
                  } ${
                    submitted && option.id === question.correctOptionId ? styles.correctOption : ""
                  } ${
                    submitted && answer.selectedOptionId === option.id && !answer.isCorrect
                      ? styles.incorrectOption
                      : ""
                  }`}
                  key={option.id}
                  type="button"
                  aria-pressed={answer?.selectedOptionId === option.id}
                  disabled={submitted}
                  onClick={() => onSelectOption(question.id, option.id)}
                >
                  {option.text}
                </button>
              ))}
            </div>
            {!submitted ? (
              <button
                className={styles.checkButton}
                type="button"
                disabled={!answer?.selectedOptionId}
                onClick={() => onSubmitAnswer(question)}
              >
                Comprobar respuesta
              </button>
            ) : (
              <p className={`${styles.feedback} ${answer.isCorrect ? styles.correctFeedback : styles.incorrectFeedback}`} role="status">
                {answer.isCorrect ? question.feedbackCorrect : question.feedbackIncorrect}
              </p>
            )}
          </section>
        );
      })}
    </div>
  </article>
);

export default ExerciseSlide;

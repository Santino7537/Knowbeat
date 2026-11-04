import styles from "./DailyScoreActivity.module.css";

function toLocalDateKey(value = new Date()) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLastSevenDays() {
  const days = [];
  const today = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    days.push({
      date: toLocalDateKey(date),
      label: date.toLocaleDateString("es-AR", { weekday: "short" })
    });
  }
  return days;
}

function DailyScoreGoalForm({ goalInput, goalError, goalLoading, onGoalInputChange, onSubmit }) {
  return (
    <form className={styles.goalForm} onSubmit={onSubmit}>
      <label className={styles.goalInputLabel} htmlFor="score-goal-input">
        Meta diaria
      </label>
      <div className={styles.goalInputRow}>
        <input
          id="score-goal-input"
          type="number"
          min="1"
          max="5000"
          step="1"
          value={goalInput}
          onChange={(event) => onGoalInputChange(event.target.value)}
          placeholder="Puntos"
          aria-label="Objetivo diario de puntos"
          aria-invalid={Boolean(goalError)}
        />
        <button type="submit" className={styles.goalSubmit} disabled={goalLoading}>
          {goalLoading ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {goalError && <p className={styles.goalError} role="alert">{goalError}</p>}
    </form>
  );
}

export default function DailyScoreActivity({
  history = [],
  scoreGoal = null,
  loading = false,
  goalInput,
  goalError,
  goalLoading,
  onGoalInputChange,
  onGoalSubmit
}) {
  const days = getLastSevenDays();
  const goalValue = Number.isFinite(Number(scoreGoal)) ? Number(scoreGoal) : 0;
  const earnedByDate = new Map(
    history.map((entry) => [entry.date, Number(entry.score_earned ?? 0)])
  );
  const maxValue = Math.max(1, goalValue, ...days.map((day) => earnedByDate.get(day.date) ?? 0));

  return (
    <section className={styles.activityCard} aria-label="Objetivo diario e historial de score">
      <header className={styles.activityHeaderRow}>
        <div>
          <p className={styles.activityEyebrow}>Historial de score</p>
          <h2 className={styles.activityTitle}>Actividad de los últimos 7 días</h2>
        </div>
        <DailyScoreGoalForm
          goalInput={goalInput}
          goalError={goalError}
          goalLoading={goalLoading}
          onGoalInputChange={onGoalInputChange}
          onSubmit={onGoalSubmit}
        />
      </header>

      {loading ? (
        <p className={styles.activityLoading}>Cargando actividad…</p>
      ) : (
        <div className={styles.activityChart} role="img" aria-label="Gráfico de actividad diaria">
          {days.map((day) => {
            const earned = earnedByDate.get(day.date) ?? 0;
            const isGoalMet = goalValue > 0 && earned >= goalValue;
            const height = earned > 0 ? Math.max((earned / maxValue) * 100, 5) : 0;

            return (
              <div key={day.date} className={styles.dayColumn}>
                <div className={styles.barWrapper} title={`${day.label}: ${earned} puntos`}>
                  {goalValue > 0 && (
                    <span
                      className={styles.goalMarker}
                      style={{ bottom: `${(goalValue / maxValue) * 100}%` }}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`${styles.dayBar} ${isGoalMet ? styles.dayBarGoal : ""}`}
                    style={{ height: `${height}%` }}
                    aria-label={`${day.label} ${earned} puntos`}
                  />
                </div>
                <span className={styles.dayLabel}>{day.label}</span>
                <strong className={styles.dayValue}>{earned}</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

import styles from "./CourseLessonMap.module.css";

const LessonNote = ({ lesson, x, y, index, selected, onSelect }) => {
  const selectOnKeyboard = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(lesson);
    }
  };

  const stateLabel = {
    completed: "completada",
    available: "disponible",
    locked: "bloqueada"
  }[lesson.status];

  return (
    <g
      className={`${styles.lessonNote} ${styles[lesson.status]} ${selected ? styles.selected : ""}`}
      role="button"
      tabIndex="0"
      aria-label={`Lección ${index + 1}: ${lesson.title}, ${stateLabel}`}
      aria-pressed={selected}
      onClick={() => onSelect(lesson)}
      onKeyDown={selectOnKeyboard}
    >
      {selected && <circle className={styles.selectionRing} cx={x} cy={y - 8} r="39" />}
      <circle className={styles.noteHitTarget} cx={x} cy={y - 16} r="45" />
      <path className={styles.noteStem} d={`M ${x + 15} ${y - 5} V ${y - 70}`} />
      <path
        className={styles.noteFlag}
        d={`M ${x + 15} ${y - 70} C ${x + 48} ${y - 64}, ${x + 47} ${y - 49}, ${x + 20} ${y - 36} L ${x + 17} ${y - 43} C ${x + 35} ${y - 52}, ${x + 34} ${y - 59}, ${x + 15} ${y - 62} Z`}
      />
      <ellipse className={styles.noteHead} cx={x} cy={y} rx="22" ry="15" />
    </g>
  );
};

export default LessonNote;
import styles from "./CourseLessonMap.module.css";

const noteVariants = [
  {
    name: "music-note-2",
    viewBox: "-7 0 30 30",
    headAnchor: 0.77,
    d: "M14.992 0c-.961 0-1.008 1.002-1.008 1.002v16.361c-2.236-1.648-5.926-1.65-9.196.226C.725 19.922-1.018 24.27.616 27.3c1.663 3.084 6.481 3.596 10.544 1.263C14.316 26.751 16.007 23.807 16 21V1c-.018-.538-.463-1-1.008-1"
  },
  {
    name: "music-note-3",
    viewBox: "0 -1 32 32",
    headAnchor: 0.72,
    d: "M31 0c-.143.049-17 4-17 4-.553.135-1 .448-1 1v14.002c-2.101-1.366-5.478-1.364-8.49.238-3.803 2.023-5.55 5.791-3.904 8.419 1.647 2.627 6.064 3.117 9.866 1.095C12.923 27.45 14.615 24.981 15 23c.067-.135 0-17.235 0-17.235l15-3.53v12.767c-2.101-1.366-5.478-1.364-8.49.238-3.803 2.023-5.55 5.791-3.904 8.419 1.647 2.627 6.064 3.117 9.866 1.095C29.923 23.45 31.615 20.981 32 19V1c0-.553-.447-1.187-1-1"
  },
  {
    name: "music-note-2-defined",
    viewBox: "-7 0 30 30",
    headAnchor: 0.77,
    d: "M10.538 26.889c-2.982 1.83-6.618 1.752-8.059-.37-1.44-2.123-.131-5.47 2.842-7.316 2.973-1.845 6.717-1.653 8.158.469 1.416 2.289-.275 5.58-2.941 7.217M14.992 0c-.961 0-1.008 1.002-1.008 1.002v16.361c-2.236-1.648-5.926-1.65-9.196.226C.725 19.922-1.018 24.27.616 27.3c1.663 3.084 6.481 3.596 10.544 1.263C14.316 26.751 16.007 23.807 16 21V1c-.018-.538-.463-1-1.008-1"
  },
  {
    name: "music-note-3-defined",
    viewBox: "0 -1 32 32",
    headAnchor: 0.73,
    d: "M27.151 23.188c-2.862 1.601-6.367 1.367-7.742-.364s-.138-4.374 2.762-5.904c2.901-1.529 5.553-1.592 7.138-.177 1.706 1.522.244 5.104-2.158 6.445M10 27c-2.895 1.571-6.199 1.603-7.593-.126-1.393-1.728-.17-4.392 2.733-5.949s5.451-1.498 7.166-.229c1.88 1.391.159 4.966-2.306 6.304M31 0a1 1 0 0 0-.419.099L14 4a1 1 0 0 0-1 1v14.002c-2.101-1.366-5.478-1.364-8.49.238-3.803 2.023-5.55 5.791-3.904 8.419 1.647 2.627 6.064 3.117 9.866 1.095C12.923 27.45 14.615 24.981 15 23V5.765l15-3.53v12.767c-2.101-1.366-5.478-1.364-8.49.238-3.803 2.023-5.55 5.791-3.904 8.419 1.647 2.627 6.236 3.243 10.053 1.251C30.517 23.419 31.771 21.106 32 19V1a1 1 0 0 0-1-1"
  },
  {
    name: "music-note",
    viewBox: "-4.5 0 32 32",
    headAnchor: 0.77,
    d: "M22.293 7.364 15.636.707c-.391-.391-1.002-.368-1.414 0C13.925.973 14 1.453 14 2v17.327c-2.219-1.644-5.881-1.647-9.124.226-4.032 2.327-5.885 6.666-4.14 9.69s6.43 3.588 10.462 1.26c3.132-1.808 4.94-4.827 4.778-7.503H16V3.971l4.879 4.807a1 1 0 1 0 1.414-1.414"
  },
  {
    name: "music-note-defined",
    viewBox: "-4.5 0 32 32",
    headAnchor: 0.78,
    d: "M10.58 28.833c-2.949 1.841-6.565 1.748-7.994-.37-1.43-2.117-.131-5.458 2.818-7.3 2.95-1.841 6.664-1.649 8.094.468s.032 5.36-2.918 7.202M22.293 7.364 15.636.707c-.391-.391-1.002-.368-1.414 0C13.925.973 14 1.453 14 2v17.327c-2.219-1.644-5.881-1.647-9.124.226-4.032 2.327-5.885 6.666-4.14 9.69s6.43 3.588 10.462 1.26C14.33 28.695 16.162 25.676 16 23V3.971l4.879 4.807a1 1 0 1 0 1.414-1.414"
  }
];
const noteVariantOrder = [0, 3, 5, 2, 4, 1, 3, 0, 4, 5, 2, 1];

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
  const lessonKey = Number(lesson.id) || index + 1;
  const variantIndex = noteVariantOrder[(lessonKey - 1) % noteVariantOrder.length];
  const noteVariant = noteVariants[variantIndex];

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
      <circle className={styles.noteHitTarget} cx={x - 22} cy={y} r="45" />
      <svg
        x={x - 56}
        y={y - 112 * noteVariant.headAnchor}
        width="112"
        height="112"
        viewBox={noteVariant.viewBox}
        aria-hidden="true"
        data-figure={noteVariant.name}
      >
        <g className={styles.noteGlyph}>
          <path fill="currentColor" fillRule="evenodd" d={noteVariant.d} />
        </g>
      </svg>
    </g>
  );
};

export default LessonNote;
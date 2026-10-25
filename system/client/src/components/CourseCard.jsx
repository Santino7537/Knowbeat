import styles from "../pages/CSS/Courses.module.css";

const courseImages = {
  guitarra: "/coursesPicture/guitarra.png",
  piano: "/coursesPicture/piano.png"
};

const getCourseImage = (name = "") => {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("guitarra")) return courseImages.guitarra;
  if (normalizedName.includes("piano")) return courseImages.piano;
  return courseImages.guitarra;
};

const CourseCard = ({
  course,
  showProgress = false,
  isEnrolled = false,
  registering = false,
  onRegister,
  onContinue
}) => {
  const totalLessons = Number(course.total_lessons) || 0;
  const currentLesson = Math.max(1, Number(course.current_lesson) || 0);
  const completedLessons = Math.min(totalLessons, Math.max(0, currentLesson - 1));
  const remainingLessons = totalLessons - completedLessons;
  const percent = totalLessons
    ? Math.min(100, Math.max(0, Math.round((completedLessons / totalLessons) * 100)))
    : 0;

  return (
    <article className={styles.course_card}>
      <img
        className={styles.course_banner}
        src={getCourseImage(course.name)}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div className={styles.course_card_content}>
        <div className={styles.course_top}>
          <h2>{course.name}</h2>
          <span className={styles.course_lesson_count}>
            {totalLessons} {totalLessons === 1 ? "lección" : "lecciones"}
          </span>
        </div>

        {showProgress ? (
          <div className={styles.course_card_footer}>
            <div className={styles.course_progress}>
              <div className={styles.progress_info}>
                <span className={styles.course_status}>
                  {totalLessons > 0 && completedLessons === totalLessons ? "Completado" : "En progreso"}
                </span>
                <span>{completedLessons} / {totalLessons} lecciones</span>
                <span>{remainingLessons} restantes</span>
                <strong className={styles.course_percent}>{percent}%</strong>
              </div>
              <div
                className={styles.progress_bar}
                role="progressbar"
                aria-label={`Progreso de ${course.name}`}
                aria-valuenow={percent}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className={styles.progress_fill}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
            <button className={styles.continue_btn} onClick={onContinue}>
              Continuar
            </button>
          </div>
        ) : (
          <div className={styles.course_card_footer}>
            <span className={isEnrolled ? styles.course_status : styles.catalog_status}>
              {isEnrolled ? "Ya estás anotado" : "Disponible"}
            </span>
            <div className={styles.catalog_actions}>
              <button
                className={styles.catalog_content_btn}
                disabled
                title="Disponible próximamente"
              >
                Ver contenido
              </button>
              <button
                className={styles.continue_btn}
                disabled={isEnrolled || registering}
                onClick={onRegister}
              >
                {isEnrolled ? "Inscripto" : registering ? "Inscribiendo..." : "Inscribirme"}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default CourseCard;
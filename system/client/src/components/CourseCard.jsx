import styles from "../pages/CSS/Courses.module.css";
import { useLanguage } from "../context/LanguageContext.jsx"; // <-- Importar hook de idioma

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
  const { t } = useLanguage(); // <-- Consumir la función de traducción

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
            {totalLessons} {totalLessons === 1 ? t("course_card.lesson_singular") : t("course_card.lesson_plural")}
          </span>
        </div>

        {showProgress ? (
          <div className={styles.course_card_footer}>
            <div className={styles.course_progress}>
              <div className={styles.progress_info}>
                <span className={styles.course_status}>
                  {totalLessons > 0 && completedLessons === totalLessons ? t("course_card.status.completed") : t("course_card.status.in_progress")}
                </span>
                <span>{completedLessons} / {totalLessons} {t("course_card.lessons_count_label")}</span>
                <span>{remainingLessons} {t("course_card.remaining_label")}</span>
                <strong className={styles.course_percent}>{percent}%</strong>
              </div>
              <div
                className={styles.progress_bar}
                role="progressbar"
                aria-label={t("course_card.progress_aria").replace("{name}", course.name)}
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
              {t("course_card.continue_btn")}
            </button>
          </div>
        ) : (
          <div className={styles.course_card_footer}>
            <span className={isEnrolled ? styles.course_status : styles.catalog_status}>
              {isEnrolled ? t("course_card.catalog.already_enrolled") : t("course_card.catalog.available")}
            </span>
            <div className={styles.catalog_actions}>
              <button
                className={styles.catalog_content_btn}
                disabled
                title={t("course_card.catalog.coming_soon_title")}
              >
                {t("course_card.catalog.view_content")}
              </button>
              <button
                className={styles.continue_btn}
                disabled={isEnrolled || registering}
                onClick={onRegister}
              >
                {isEnrolled ? t("course_card.catalog.enrolled_badge") : registering ? t("course_card.catalog.registering") : t("course_card.catalog.register_btn")}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default CourseCard;
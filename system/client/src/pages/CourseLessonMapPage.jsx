import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import CourseLessonMap from "../components/course-map/CourseLessonMap";
import { mockLessons } from "../components/course-map/lessonMockData";
import styles from "./CSS/CourseLessonMapPage.module.css";
import { useLanguage } from "../context/LanguageContext.jsx"; // <-- Importar hook de idioma

const CourseLessonMapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage(); // <-- Consumir la función de traducción
  const courseName = location.state?.courseName;

  return (
    <div className={styles.coursePage}>
      <Sidebar />
      <main className={styles.courseMain}>
        <header className={styles.pageHeader}>
          <button
            className={styles.backButton}
            type="button"
            onClick={() => navigate("/courses")}
          >
            {t("lesson_map_page.back_to_courses")}
          </button>
          {courseName && <h1 className={styles.courseTitle}>{courseName}</h1>}
        </header>

        <section className={styles.mapSection} aria-label={t("lesson_map_page.map_aria")}>
          <CourseLessonMap lessons={mockLessons} />
        </section>
      </main>
    </div>
  );
};

export default CourseLessonMapPage;
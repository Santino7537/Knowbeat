import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import CourseLessonMap from "../components/course-map/CourseLessonMap";
import { mockLessons } from "../components/course-map/lessonMockData";
import styles from "./CSS/CourseLessonMapPage.module.css";

const CourseLessonMapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const courseName = location.state?.courseName;

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const settings = user?.configuration || user;
  const isLightMode = settings?.appearance?.dark_mode === false;

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
    return () => document.body.classList.remove("light-mode");
  }, [isLightMode]);

  return (
    <div className={`${styles.coursePage} ${isLightMode ? styles.lightMode : ""}`}>
      <Sidebar />
      <main className={styles.courseMain}>
        <header className={styles.pageHeader}>
          <button
            className={styles.backButton}
            type="button"
            onClick={() => navigate("/courses")}
          >
            Volver a mis cursos
          </button>
          {courseName && <h1 className={styles.courseTitle}>{courseName}</h1>}
        </header>

        <section className={styles.mapSection} aria-label="Recorrido de lecciones">
          <CourseLessonMap lessons={mockLessons} />
        </section>
      </main>
    </div>
  );
};

export default CourseLessonMapPage;
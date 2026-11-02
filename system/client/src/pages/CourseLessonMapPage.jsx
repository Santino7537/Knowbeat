import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import CourseLessonMap from "../components/course-map/CourseLessonMap";
import { mockLessons } from "../components/course-map/lessonMockData";
import styles from "./CSS/CourseLessonMapPage.module.css";

const CourseLessonMapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
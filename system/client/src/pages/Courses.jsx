import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import CourseCard from "../components/CourseCard";
import styles from "./CSS/Courses.module.css";
import { API_URL, getErrorMessage } from "../api/client";
import { useLanguage } from "../context/LanguageContext.jsx"; // <-- Importar hook de idioma

const Courses = () => {
  const navigate = useNavigate();
  const { t } = useLanguage(); // <-- Consumir la función de traducción

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  /* ==========================================
     INIT
  ========================================== */

  useEffect(() => {
    let active = true;

    const init = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${API_URL}/user/get/progress`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (active) setCourses(response.data);
      } catch (error) {
        if (active) setError(getErrorMessage(error, t("courses_page.errors.load_failed")));
      } finally {
        if (active) setLoading(false);
      }
    };

    init();
    return () => { active = false; };
  }, [token, reloadKey, t]);

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className={styles.courses_loading}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.courses_layout}>
      <Sidebar />
      <main className={styles.courses_main}>

        {/* HEADER */}

        <div className={styles.courses_header}>
          <div>
            <h1>{t("courses_page.title")}</h1>
            <p>
              {t("courses_page.subtitle")}
            </p>
          </div>
          <div className={styles.catalog_header_actions}>
            <div className={styles.user_info}>
              <span>{user?.username}</span>
            </div>
            <button
              className={styles.catalog_back_btn}
              onClick={() => navigate("/courses/catalog")}
            >
              {t("courses_page.explore_catalog")}
            </button>
          </div>

        </div>

        {/* EMPTY / ERROR */}

        {error && (
          <div className={styles.catalog_message_error} role="alert">
            {error}{" "}
            <button type="button" className={styles.catalog_back_btn} onClick={() => setReloadKey((k) => k + 1)}>
              {t("courses_page.retry")}
            </button>
          </div>
        )}

        {
          !error && courses.length === 0 && (
            <div className={styles.empty_state}>
              <h2>
                {t("courses_page.empty.title")}
              </h2>
              <p>
                {t("courses_page.empty.desc")}
              </p>
            </div>
          )
        }

        {/* GRID */}
        <div className={styles.courses_grid}>
          {courses.map((course) => (
            <CourseCard
              key={course.course_id}
              course={course}
              showProgress
              onContinue={() => navigate(`/courses/${course.course_id}/lessons`, {
                state: { courseName: course.name }
              })}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Courses;
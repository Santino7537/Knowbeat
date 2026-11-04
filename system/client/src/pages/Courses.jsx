import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import CourseCard from "../components/CourseCard";
import styles from "./CSS/Courses.module.css";
import { API_URL, getErrorMessage } from "../api/client";

const Courses = () => {
  const navigate = useNavigate();
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
        if (active) setError(getErrorMessage(error, "No pudimos cargar tus cursos."));
      } finally {
        if (active) setLoading(false);
      }
    };

    init();
    return () => { active = false; };
  }, [token, reloadKey]);

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
            <h1>Mis Cursos</h1>
            <p>
              Continuá aprendiendo donde
              lo dejaste.
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
              Explorar catálogo
            </button>
          </div>

        </div>

        {/* EMPTY */}

        {error && (
          <div className={styles.catalog_message_error} role="alert">
            {error}{" "}
            <button type="button" className={styles.catalog_back_btn} onClick={() => setReloadKey((k) => k + 1)}>
              Reintentar
            </button>
          </div>
        )}

        {
          !error && courses.length === 0 && (
            <div className={styles.empty_state}>
              <h2>
                Todavía no estás anotado
                a ningún curso
              </h2>
              <p>
                Cuando te inscribas a un
                curso aparecerá aquí.
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
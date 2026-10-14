import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import CourseCard from "./CourseCard";
import styles from "./CSS/Courses.module.css";

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const settings = user?.configuration || user;

  /* ==========================================
      APLICAR CONFIGURACIÓN DE DARK MODE
  ========================================== */

  useEffect(() => {
    if (settings?.appearance?.dark_mode === false) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
    return () => document.body.classList.remove("light-mode");
  }, [settings?.appearance?.dark_mode]);

  /* ==========================================
      INIT
  ========================================== */

  useEffect(() => {
    let active = true;

    const init = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://localhost:3000/user/get/progress",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (active) setCourses(response.data);
      } catch (error) {
        console.error("Error obteniendo cursos:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    init();
    return () => { active = false; };
  }, [token]);

  /* ==========================================
      LOADING
  ========================================== */

  if (loading) {
    return (
      <div className={styles.courses_loading}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className={`${styles.courses_layout} ${
      settings?.appearance?.dark_mode === false ? styles.light_mode : ""
    }`}>
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

        {
          courses.length === 0 && (
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
            <CourseCard key={course.course_id} course={course} showProgress />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Courses;
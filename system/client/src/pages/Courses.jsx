import { useEffect, useState } from "react";
import axios from "axios";

import Sidebar from "../components/Sidebar";

import "./CSS/Courses.css";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  /* ==========================================
      APLICAR CONFIGURACIÓN DE DARK MODE
  ========================================== */

  useEffect(() => {
    if (user?.configuration?.apariencia?.modo_oscuro === false) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [user]);

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  /* ==========================================
      FETCH COURSES
  ========================================== */

  const fetchCourses = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/user/get/progress",
        authHeaders
      );

      setCourses(res.data);
    } catch (error) {
      console.error(
        "Error obteniendo cursos:",
        error
      );
    }
  };

  /* ==========================================
      INIT
  ========================================== */

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      await fetchCourses();

      setLoading(false);
    };

    init();
  }, []);

  /* ==========================================
      HELPERS
  ========================================== */

  const calculatePercent = (
    current,
    total
  ) => {
    if (!total) return 0;

    return Math.round(
      (current / total) * 100
    );
  };

  /* ==========================================
      LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="courses-loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="courses-layout">
      <Sidebar />

      <main className="courses-main">

        {/* HEADER */}

        <div className="courses-header">

          <div>
            <h1>Mis Cursos</h1>

            <p>
              Continuá aprendiendo donde
              lo dejaste.
            </p>
          </div>

          <div className="user-info">
            <span>{user?.username}</span>
          </div>

        </div>

        {/* EMPTY */}

        {
          courses.length === 0 && (
            <div className="empty-state">

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

        <div className="courses-grid">

          {
            courses.map((course) => {

              const currentLesson =
                course.current_lesson || 0;

              const totalLessons =
                course.total_lessons || 0;

              const percent =
                calculatePercent(
                  currentLesson,
                  totalLessons
                );

              const remaining =
                totalLessons -
                currentLesson;

              return (

                <div
                  key={course.course_id}
                  className="course-card"
                >

                  <div className="course-top">

                    <h2>
                      {course.name}
                    </h2>

                    <span className="course-percent">
                      {percent}%
                    </span>

                  </div>

                  <span className="course-status">
                    En progreso
                  </span>

                  <div className="progress-info">

                    <span>
                      {currentLesson} /{" "}
                      {totalLessons} lecciones
                    </span>

                    <span>
                      {remaining} restantes
                    </span>

                  </div>

                  <div className="progress-bar">

                    <div
                      className="progress-fill"
                      style={{
                        width: `${percent}%`
                      }}
                    />

                  </div>

                  <button className="continue-btn">
                    Continuar
                  </button>

                </div>

              );
            })
          }

        </div>

      </main>
    </div>
  );
};

export default Courses;
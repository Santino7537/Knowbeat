import { useEffect, useState } from "react";
import axios from "axios";
import "./CSS/Courses.css";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================
  // FETCH COURSES
  // =========================
  const fetchCourses = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/courses",
        authHeaders
      );

      setCourses(res.data);
    } catch (err) {
      console.error("Error courses:", err);
    }
  };

  // =========================
  // FETCH PROGRESS
  // =========================
  const fetchProgress = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/progress",
        authHeaders
      );

      setProgress(res.data);
    } catch (err) {
      console.error("Error progress:", err);
    }
  };

  // =========================
  // REGISTER COURSE
  // =========================
  const handleEnroll = async (courseId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/courses/${courseId}/register`,
        {},
        authHeaders
      );

      // refrescar data
      fetchCourses();
      fetchProgress();
    } catch (err) {
      console.error("Error enroll:", err);
    }
  };

  // =========================
  // HELPERS
  // =========================
  const getProgressByCourse = (courseId) => {
    return progress.find((p) => p.course_id === courseId);
  };

  const calculatePercent = (current, total) => {
    if (!total) return 0;
    return Math.round((current / total) * 100);
  };

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCourses();
      await fetchProgress();
      setLoading(false);
    };

    init();
  }, []);

  // =========================
  // UI
  // =========================
  if (loading) {
    return (
      <div className="courses-container">
        <div className="loader">Cargando cursos...</div>
      </div>
    );
  }

  return (
    <div className="courses-container">
      {/* HEADER */}
      <div className="courses-header">
        <h1>Mis Cursos</h1>
        <p>
          Usuario: <span>{user?.username}</span> • ID: {user?.id}
        </p>
      </div>

      {/* GRID */}
      <div className="courses-grid">
        {courses.map((course) => {
          const userProgress = getProgressByCourse(course.id);
          const percent = userProgress
            ? calculatePercent(
                userProgress.current_lesson,
                userProgress.total_lessons
              )
            : 0;

          return (
            <div key={course.id} className="course-card">
              <div className="course-top">
                <h2>{course.name}</h2>

                {course.isEnrolled ? (
                  <span className="badge enrolled">Inscripto</span>
                ) : (
                  <span className="badge not-enrolled">Disponible</span>
                )}
              </div>

              {/* PROGRESS */}
              {course.isEnrolled && userProgress ? (
                <div className="progress-section">
                  <div className="progress-text">
                    <span>
                      Lección {userProgress.current_lesson} /{" "}
                      {userProgress.total_lessons}
                    </span>
                    <span>{percent}%</span>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="not-started">Aún no empezaste este curso</p>
              )}

              {/* ACTION */}
              <div className="course-actions">
                {!course.isEnrolled ? (
                  <button
                    className="btn primary"
                    onClick={() => handleEnroll(course.id)}
                  >
                    Inscribirme
                  </button>
                ) : (
                  <button className="btn secondary">
                    Continuar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Courses;
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import CourseCard from "./CourseCard";
import styles from "./CSS/Courses.module.css";

const CoursesCatalog = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [registeringId, setRegisteringId] = useState(null);

  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const settings = user?.configuration || user;
  const isLightMode = settings?.appearance?.dark_mode === false;
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
    return () => document.body.classList.remove("light-mode");
  }, [isLightMode]);

  useEffect(() => {
    let active = true;

    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/course/get/courses",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (active) {
          setCourses(Array.isArray(response.data) ? response.data : []);
        }
      } catch {
        if (active) setError("No se pudo cargar el catálogo. Probá nuevamente.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCourses();
    return () => { active = false; };
  }, [token]);

  const registerCourse = async (courseId) => {
    setRegisteringId(courseId);
    setError("");
    setMessage("");

    try {
      await axios.post(
        `http://localhost:3000/user/register/course/${courseId}`,
        {},
        authHeaders
      );
      setCourses((currentCourses) => currentCourses.map((course) => (
        course.course_id === courseId
          ? { ...course, is_enrolled: 1 }
          : course
      )));
      setMessage("Ya estás anotado al curso. Lo encontrarás en Mis Cursos.");
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        setCourses((currentCourses) => currentCourses.map((course) => (
          course.course_id === courseId
            ? { ...course, is_enrolled: 1 }
            : course
        )));
        setMessage("Ya estabas anotado a este curso.");
      } else {
        setError(requestError.response?.data?.error || "No se pudo completar la inscripción.");
      }
    } finally {
      setRegisteringId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.courses_loading}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className={`${styles.courses_layout} ${isLightMode ? styles.light_mode : ""}`}>
      <Sidebar />
      <main className={styles.courses_main}>
        <div className={styles.courses_header}>
          <div>
            <h1>Catálogo de cursos</h1>
            <p>Explorá los cursos disponibles para aprender.</p>
          </div>
          <div className={styles.catalog_header_actions}>
            <div className={styles.user_info}>
              <span>{user?.username}</span>
            </div>
            <button
              className={styles.catalog_back_btn}
              onClick={() => navigate("/courses")}
            >
              Mis Cursos
            </button>
          </div>
        </div>

        {error && <p className={styles.catalog_message_error} role="alert">{error}</p>}
        {message && <p className={styles.catalog_message_success} role="status">{message}</p>}

        {courses.length === 0 ? (
          <div className={styles.empty_state}>
            <h2>No hay cursos disponibles</h2>
            <p>Cuando se agreguen cursos, aparecerán en este catálogo.</p>
          </div>
        ) : (
          <div className={styles.catalog_list}>
            {courses.map((course) => {
              const isEnrolled = Boolean(Number(course.is_enrolled));

              return (
                <CourseCard
                  key={course.course_id}
                  course={course}
                  isEnrolled={isEnrolled}
                  registering={registeringId === course.course_id}
                  onRegister={() => registerCourse(course.course_id)}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CoursesCatalog;
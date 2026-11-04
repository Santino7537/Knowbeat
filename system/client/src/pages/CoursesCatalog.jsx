import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import CourseCard from "../components/CourseCard";
import styles from "./CSS/Courses.module.css";
import { getErrorMessage } from "../api/client";
import { useLanguage } from "../context/LanguageContext.jsx"; // <-- Importar hook de idioma

const CoursesCatalog = () => {
  const navigate = useNavigate();
  const { t } = useLanguage(); // <-- Consumir la función de traducción

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
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

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
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError, t("catalog_page.errors.load_failed")));
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCourses();
    return () => { active = false; };
  }, [token, t]);

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
      setMessage(t("catalog_page.messages.registered_success"));
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        setCourses((currentCourses) => currentCourses.map((course) => (
          course.course_id === courseId
            ? { ...course, is_enrolled: 1 }
            : course
        )));
        setMessage(t("catalog_page.messages.already_registered"));
      } else {
        setError(getErrorMessage(requestError, t("catalog_page.errors.register_failed")));
      }
    } finally {
      setRegisteringId(null);
    }
  };

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
        <div className={styles.courses_header}>
          <div>
            <h1>{t("catalog_page.title")}</h1>
            <p>{t("catalog_page.subtitle")}</p>
          </div>
          <div className={styles.catalog_header_actions}>
            <div className={styles.user_info}>
              <span>{user?.username}</span>
            </div>
            <button
              className={styles.catalog_back_btn}
              onClick={() => navigate("/courses")}
            >
              {t("catalog_page.my_courses_btn")}
            </button>
          </div>
        </div>

        {error && <p className={styles.catalog_message_error} role="alert">{error}</p>}
        {message && <p className={styles.catalog_message_success} role="status">{message}</p>}

        {courses.length === 0 ? (
          <div className={styles.empty_state}>
            <h2>{t("catalog_page.empty.title")}</h2>
            <p>{t("catalog_page.empty.desc")}</p>
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
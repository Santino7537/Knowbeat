import AdminView from './pages/AdminView.jsx'
import Settings from './pages/Settings.jsx'
import Landing from './pages/Landing.jsx'
import Courses from './pages/Courses.jsx';
import CoursesCatalog from './pages/CoursesCatalog.jsx';
import CourseLessonMapPage from './pages/CourseLessons.jsx';
import UserProfile from './pages/UserProfile.jsx'
import Exercises from './pages/Exercises.jsx';
import SeventhChordsExercise from './exercises-pages/seventh-chords.jsx'

import Login_register from './pages/login_register.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import './App.css'

const getPageTitle = (pathname) => {
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  if (normalizedPath === "/") return "Inicio";
  if (normalizedPath === "/admin") return "Administración";
  if (normalizedPath === "/settings") return "Configuración";
  if (normalizedPath === "/login") return "Iniciar sesión";
  if (normalizedPath === "/courses") return "Cursos";
  if (normalizedPath === "/courses/catalog") return "Catálogo de cursos";
  if (/^\/courses\/[^/]+\/lessons$/.test(normalizedPath)) return "Lecciones del curso";
  if (normalizedPath === "/exercises") return "Ejercicios";
  if (normalizedPath === "/exercises/seventh-chords") return "Notas de acordes de séptima";
  if (/^\/user\/[^/]+$/.test(normalizedPath)) return "Perfil";

  return "KnowBeat";
};

function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getPageTitle(pathname);
  }, [pathname]);

  return null;
}

function App() {
  return (
      // AuthProvider envuelve todo el árbol: el fetch del token
      // ocurre una sola vez aquí y el resultado queda disponible
      // en cualquier componente via useAuth()
    <>
      <AuthProvider>
        <DocumentTitle />
        <Routes>
          <Route path="/admin" element={<AdminView />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/Login" element={<Login_register />} />
          <Route path="/" element={<Landing />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/catalog" element={<CoursesCatalog />} />
          <Route path="/courses/:courseId/lessons" element={<CourseLessonMapPage />} />
          <Route path="/exercises" element={<Exercises />}/>
          <Route path="/exercises/seventh-chords" element={<SeventhChordsExercise />} />
          
          {/* PERFIL — :userId permite ver el perfil de cualquier usuario */}
          <Route path="/user/:username" element={<UserProfile />} />
        </Routes>
      </AuthProvider>
    </>
  )
}

export default App;
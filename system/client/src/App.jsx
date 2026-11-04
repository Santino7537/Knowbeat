import AdminView from './pages/AdminView.jsx'
import AdminAccess from './pages/AdminAccess.jsx'
import Settings from './pages/Settings.jsx'
import Landing from './pages/Landing.jsx'
import Courses from './pages/Courses.jsx';
import CoursesCatalog from './pages/CoursesCatalog.jsx';
import CourseLessonMapPage from './pages/CourseLessons.jsx';
import UserProfile from './pages/UserProfile.jsx'
import Exercises from './pages/Exercises.jsx';
import SeventhChordsExercise from './exercises-pages/seventh-chords.jsx'
import Community from './pages/Community.jsx';
import Messages from './pages/Messages.jsx';
import Folders from './pages/Folders.jsx';

import Login_register from './pages/login_register.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { useEffect, useState } from "react";
import { Navigate, Outlet, Routes, Route, useLocation } from "react-router-dom";
import './App.css'

const getPageTitle = (pathname) => {
  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  if (normalizedPath === "/") return "Inicio";
  if (normalizedPath === "/admin") return "Administración";
  if (normalizedPath === "/admin/verify") return "Verificación administrativa";
  if (normalizedPath === "/settings") return "Configuración";
  if (normalizedPath === "/login") return "Iniciar sesión";
  if (normalizedPath === "/courses") return "Cursos";
  if (normalizedPath === "/courses/catalog") return "Catálogo de cursos";
  if (/^\/courses\/[^/]+\/lessons$/.test(normalizedPath)) return "Lecciones del curso";
  if (normalizedPath === "/exercises") return "Ejercicios";
  if (normalizedPath === "/exercises/seventh-chords") return "Notas de acordes de séptima";
  if (normalizedPath === "/community") return "Comunidad";
  if (normalizedPath === "/messages") return "Mensajes";
  if (normalizedPath === "/folders" || /^\/folders\/[^/]+$/.test(normalizedPath)) return "Carpetas";
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

function ProtectedRoutes() {
  const { loggedUser, loadingAuth } = useAuth();

  if (loadingAuth) return null;
  if (!loggedUser) return <Navigate to="/" replace />;

  return <Outlet />;
}

function AdminProtectedRoutes() {
  const {
    loggedUser,
    loadingAuth,
    adminAuthorization,
    validateAdminAuthorization,
    clearAdminAuthorization
  } = useAuth();
  const location = useLocation();
  const [validating, setValidating] = useState(true);
  const [accessValid, setAccessValid] = useState(false);

  useEffect(() => {
    let active = true;
    if (!adminAuthorization) return undefined;

    const validate = async (showLoading = false) => {
      if (showLoading) setValidating(true);
      const valid = await validateAdminAuthorization();
      if (active) {
        setAccessValid(valid);
        if (showLoading) setValidating(false);
      }
    };

    validate(true);
    const expiresIn = Math.max(0, adminAuthorization.expiresAt - Date.now());
    const expiryTimeout = window.setTimeout(() => {
      clearAdminAuthorization();
      setAccessValid(false);
    }, expiresIn);
    const intervalId = window.setInterval(() => validate(), 30000);
    return () => {
      active = false;
      window.clearTimeout(expiryTimeout);
      window.clearInterval(intervalId);
    };
  }, [adminAuthorization, clearAdminAuthorization, validateAdminAuthorization]);

  if (loadingAuth) return null;
  if (!loggedUser || loggedUser.role !== "Administrator") {
    return <Navigate to="/courses" replace />;
  }
  if (!adminAuthorization) {
    return <Navigate to="/admin/verify" replace state={{ from: location }} />;
  }
  if (validating) return null;
  if (!accessValid) return <Navigate to="/admin/verify" replace state={{ from: location }} />;

  return <Outlet />;
}

function AdminVerificationRoute() {
  const { loggedUser, loadingAuth, adminAuthorization } = useAuth();
  if (loadingAuth) return null;
  if (!loggedUser) return <Navigate to="/" replace />;
  if (loggedUser.role !== "Administrator") return <Navigate to="/courses" replace />;
  if (adminAuthorization) {
    return <Navigate to="/admin" replace />;
  }
  return <AdminAccess />;
}

// Envuelve las rutas con una key por pathname: cada navegación remonta el
// contenedor y dispara la animación de entrada definida en styles/base.css.
function RouteTransition({ children }) {
  const { pathname } = useLocation();
  return <div key={pathname} className="kb-route">{children}</div>;
}

function App() {
  return (
      // AuthProvider envuelve todo el árbol: el fetch del token
      // ocurre una sola vez aquí y el resultado queda disponible
      // en cualquier componente via useAuth()
    <>
      <ThemeProvider>
      <ToastProvider>
      <AuthProvider>
        <DocumentTitle />
        <RouteTransition>
        <Routes>
          <Route path="/Login" element={<Login_register />} />
          <Route path="/" element={<Landing />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/admin/verify" element={<AdminVerificationRoute />} />
            <Route element={<AdminProtectedRoutes />}>
              <Route path="/admin" element={<AdminView />} />
            </Route>
            <Route path="/settings" element={<Settings />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/catalog" element={<CoursesCatalog />} />
            <Route path="/courses/:courseId/lessons" element={<CourseLessonMapPage />} />
            <Route path="/exercises" element={<Exercises />}/>
            <Route path="/exercises/seventh-chords" element={<SeventhChordsExercise />} />
            <Route path="/messages" element={<Messages/>} />
            <Route path="/folders" element={<Folders />} />
            <Route path="/folders/:folderId" element={<Folders />} />
            <Route path="/user/:username" element={<UserProfile />} />
          </Route>
          <Route path="/community" element={<Community/>} />
      </Routes>
        </RouteTransition>
      </AuthProvider>
      </ToastProvider>
      </ThemeProvider>
    </>
  )
}

export default App;
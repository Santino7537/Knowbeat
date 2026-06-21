import AdminView from './pages/AdminView.jsx'
import Settings from './pages/Settings.jsx'
import Landing from './pages/Landing.jsx'
import Courses from './pages/Courses.jsx'
import UserProfile from './pages/UserProfile.jsx'
import Login_register from './pages/login_register.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'

function App() {
  return (
    // AuthProvider envuelve todo el árbol: el fetch del token
    // ocurre una sola vez aquí y el resultado queda disponible
    // en cualquier componente via useAuth().
    <AuthProvider>
      <Routes>

        {/* ADMIN */}
        <Route path="/admin"  element={<AdminView />} />

        {/* SETTINGS */}
        <Route path="/settings" element={<Settings />} />

        {/* LOGIN / REGISTER */}
        <Route path="/Login" element={<Login_register />} />

        {/* LANDING */}
        <Route path="/" element={<Landing />} />

        {/* COURSES */}
        <Route path="/courses" element={<Courses />} />

        {/* PERFIL — :userId permite ver el perfil de cualquier usuario */}
        <Route path="/user/:username" element={<UserProfile />} />

      </Routes>
    </AuthProvider>
  );
}

export default App;
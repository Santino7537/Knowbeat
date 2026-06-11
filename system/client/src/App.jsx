import AdminView from './pages/AdminView.jsx'
import Settings from './pages/Settings.jsx'
import Landing from './pages/Landing.jsx'
import Courses from './pages/Courses.jsx';
import UserProfile from './pages/UserProfile.jsx';

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Login_register from './pages/login_register.jsx'

import './App.css'

function App() {

  return (
    <>
      <Routes>

        {/* =========================
            ADMIN
        ========================= */}

        <Route
          path="/admin"
          element={
            <AdminView />
          }
        />

        {/* =========================
            SETTINGS
        ========================= */}

        <Route
          path="/settings"
          element={<Settings />}
        />

        {/* =========================
            LOGIN / REGISTER
        ========================= */}

        <Route
          path="/Login"
          element={<Login_register/>}
        />

        {/* =========================
            LANDING PAGE
        ========================= */}

        <Route
          path="/"
          element={
            <Landing />
          }
        />

        <Route
          path="/courses"
          element={
            <Courses />
          }
        />

        <Route
          path="/user"
          element={
            <UserProfile />
          }
        />
      </Routes>
    </>
  )
}

export default App
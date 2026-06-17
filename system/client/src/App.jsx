import AdminView from './pages/AdminView.jsx'
import Settings from './pages/Settings.jsx'
import Landing from './pages/Landing.jsx'
import Courses from './pages/Courses.jsx';
import UserProfile from './pages/UserProfile.jsx';
import { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import Login_register from './pages/login_register.jsx'
import './App.css'
import axios from 'axios';

function App() {
  async function getUserByToken() {
    try{
      const response = await axios.get("http://localhost:3000/token/get/user", {
        headers : {
          authorization : localStorage.getItem("token")
        }
      })
    } catch (err) {
      console.error(error.response?.data || error);
    }
  }

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
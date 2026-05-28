import AdminView from './pages/AdminView.jsx'
import Settings from './pages/Settings.jsx'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/login_register.jsx'
import './App.css'


function App() {

  return (
    <>

      <Routes>

        <Route
          path="/admin"
          element={
            <AdminView />
          }
        />

        {/* ======================================
            SETTINGS
        ====================================== */}

        <Route
          path="/settings"
          element={<Settings />}
        />

        {/* ======================================
            LOGIN
        ====================================== */}

        <Route
          path="/"
          element={<Login />}
        />

      </Routes>

    </>
  )
}

export default App
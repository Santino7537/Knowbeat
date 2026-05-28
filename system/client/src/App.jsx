import AdminView from './pages/AdminView.jsx'
import Settings from './pages/Settings.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import Login from './pages/login_register.jsx'
import './App.css'

function App() {

  return (
    <>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/register" element={<Login />} />
        <Route path="/settings" element={<Settings />} />

        {/* Rutas protegidas */}
        <Route path="/" element={<AdminView />} />
      </Routes>
    </>
  )
}

export default App

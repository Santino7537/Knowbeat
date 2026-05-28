import AdminView from './pages/AdminView.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import Login from './pages/login_register.jsx'
import './App.css'

function App() {

  return (
    <>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />

        {/* Rutas protegidas */}
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </>
  )
}

export default App

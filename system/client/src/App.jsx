import AdminView from './pages/AdminView.jsx'
import Settings from './pages/Settings.jsx'
import Landing from './pages/Landing.jsx'
import Courses from './pages/Courses.jsx';
import Exercises from './pages/Exercises.jsx';
import SeventhChordsExercise from './exercises-pages/seventh-chords.jsx'
import { Routes, Route } from 'react-router-dom'

import Login_register from './pages/login_register.jsx'

import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path="/admin" element={<AdminView />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/Login" element={<Login_register />} />
        <Route path="/" element={<Landing />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/exercises" element={<Exercises />}/>
        <Route path="/exercises/seventh-chords" element={<SeventhChordsExercise />} />
      </Routes>
    </>
  )
}

export default App
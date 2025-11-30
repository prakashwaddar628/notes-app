import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import NotesPage from "./pages/NotesPage"

function App() {
  const isAuthed = !!localStorage.getItem("access_token")

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />}/>
      <Route path="/register" element={<RegisterPage />}/>
      <Route 
      path="/notes"
      element={isAuthed? <NotesPage /> : <Navigate to="/login" replace/>}
      />
      <Route path="*" element={<Navigate to="/notes" replace/>} />
    </Routes>
  )
}

export default App

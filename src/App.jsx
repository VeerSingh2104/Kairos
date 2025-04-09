import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RoleSelection from './pages/auth/RoleSelection'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import './styles/base.css'
import './styles/components/auth.css'

function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/role-selection" element={<RoleSelection />} />
          <Route path="/auth/login/:role" element={<Login />} />
          <Route path="/auth/signup/:role" element={<Signup />} />
          <Route path="/manager/dashboard" element={<div>Manager Dashboard</div>} />
          <Route path="/candidate/dashboard" element={<div>Candidate Dashboard</div>} />
          <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
        </Routes>
      </Router>
    </div>
  )
}

export default App

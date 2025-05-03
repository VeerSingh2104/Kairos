import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoleSelection from './pages/auth/RoleSelection';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import SuccessPage from './pages/auth/SuccessPage';
import AdminDashboard from './pages/adminDashboard';
import ManagerDashboard from './pages/managerDashboard';
import CandidateDashboard from './pages/candidateDashboard';
import ProfileSetupPage from './pages/ProfileSetupPage';
import './styles/base.css';
import './styles/components/auth.css';

function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/role-selection" element={<RoleSelection />} />
          <Route path="/auth/login/:role" element={<Login />} />
          <Route path="/auth/signup/:role" element={<Signup />} />
          <Route path="/auth/success" element={<SuccessPage />} />
          <Route path="/profile-setup" element={<ProfileSetupPage />} />
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

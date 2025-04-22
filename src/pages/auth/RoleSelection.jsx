import { useNavigate } from 'react-router-dom'
import '../../styles/components/auth.css'

function RoleSelection() {
  const navigate = useNavigate()

  const handleRoleSelect = (role) => {
    const searchParams = new URLSearchParams(window.location.search)
    const action = searchParams.get('action') || 'login'
    navigate(`/auth/${action}/${role}`, { replace: true })
  }

  return (
    <section className="auth-section">
<div className="container">
  <h2>Who are you signing in as?</h2>
  <p className="lead">Select your role to continue</p>
  
  <div className="role-cards">
    <div className="role-card" onClick={() => handleRoleSelect('manager')}>
      <h3>Manager</h3>
      <p>Manage candidates and interviews</p>
    </div>
    
    <div className="role-card" onClick={() => handleRoleSelect('candidate')}>
      <h3>Candidate</h3>
      <p>Apply for positions and track applications</p>
    </div>
    
    <div className="role-card" onClick={() => handleRoleSelect('admin')}>
      <h3>Admin</h3>
      <p>Manage system settings and users</p>
    </div>
  </div>
</div>
    </section>
  )
}

export default RoleSelection

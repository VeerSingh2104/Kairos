import { useParams, useNavigate } from 'react-router-dom'
import '../../styles/components/auth.css'

function Signup() {
  const { role } = useParams()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle signup logic here
    navigate(`/${role}/dashboard`, { replace: true })
  }

  return (
    <section className="auth-section">
      <div className="container">
        <h2>Sign up as {role}</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder={`Enter your ${role} email`}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Create a password"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input 
              type="password" 
              id="confirm-password" 
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <button type="submit" className="submit-btn">
            Create Account
          </button>
          
          <p style={{ marginTop: '1rem', color: 'var(--light-text)' }}>
            Already have an account?{' '}
            <span 
              style={{ color: 'var(--highlight-color)', cursor: 'pointer' }}
              onClick={() => navigate(`/auth/login/${role}`)}
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </section>
  )
}

export default Signup

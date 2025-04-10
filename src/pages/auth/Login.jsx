import { useParams, useNavigate } from 'react-router-dom'
import '../../styles/components/auth.css'

function Login() {
  const { role } = useParams()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle login logic here
    navigate(`/${role}/dashboard`, { replace: true })
  }

  return (
    <section className="auth-section">
      <div className="container">
        <h2>Login as {role}</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="submit-btn">
            Login
          </button>
          
          <p style={{ marginTop: '1rem', color: 'var(--light-text)' }}>
            Don't have an account?{' '}
            <span 
              style={{ color: 'var(--highlight-color)', cursor: 'pointer' }}
              onClick={() => navigate(`/auth/signup/${role}`)}
            >
              Sign up
            </span>
          </p>
        </form>
      </div>
    </section>
  )
}

export default Login

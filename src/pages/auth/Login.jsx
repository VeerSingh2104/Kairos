import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react';
import { 
  signInWithPopup,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../../firebase';
import Session from '../../models/Session';
import '../../styles/components/auth.css'

function Login() {
  const { role } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            // Handle email/password login logic here
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create a session in MongoDB
            const session = new Session({
                userId: user.uid,
                token: user.accessToken,
                expiresAt: new Date(Date.now() + 3600000), // 1 hour expiration
                ipAddress: '', // Optionally capture IP
                userAgent: navigator.userAgent
            });
            await session.save();

            navigate(`/${role}/dashboard`, { replace: true });
        } catch (error) {
            console.error('Login error:', error);
            setError('Failed to login');
        }
    }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create session for Google login
      const session = new Session({
        userId: user.uid,
        token: user.accessToken,
        expiresAt: new Date(Date.now() + 3600000),
        userAgent: navigator.userAgent
      });
      await session.save();
      
      navigate(`/${role}/dashboard`, { replace: true });
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      // Create session for Facebook login
      const session = new Session({
        userId: user.uid,
        token: user.accessToken,
        expiresAt: new Date(Date.now() + 3600000),
        userAgent: navigator.userAgent
      });
      await session.save();
      
      navigate(`/${role}/dashboard`, { replace: true });
    } catch (error) {
      console.error('Facebook login error:', error);
      setError('Failed to login with Facebook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="container">
        <h2>Login as {role}</h2>
        {error && <div className="auth-error">{error}</div>}
        {loading && <div className="auth-loading">Loading...</div>}
        
        <div className="social-auth-buttons">
          <button 
            type="button" 
            className="google-btn"
            onClick={handleGoogleLogin}
          >
            Continue with Google
          </button>
          <button 
            type="button" 
            className="facebook-btn"
            onClick={handleFacebookLogin}
          >
            Continue with Facebook
          </button>
        </div>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>

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

import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react';
import { 
  signInWithPopup,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../../firebase';
import User from '../../models/User';
import '../../styles/components/auth.css'

function Login() {
  const { role } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const redirectAfterLogin = async (user) => {
    try {
      const userData = await User.getById(user.uid);
      if (userData) {
        if (userData.role !== role) {
          setError(`You are not authorized to login as ${role}`);
          await auth.signOut();
          return;
        }
        if (userData.profileComplete) {
          navigate(`/${role}/dashboard`, { replace: true });
        } else {
          navigate('/profile-setup', { replace: true });
        }
      } else {
        setError('User data not found');
        await auth.signOut();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    // Reset errors
    setEmailError('');
    setPasswordError('');
    setError('');

    // Validate inputs
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await redirectAfterLogin(user);
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await redirectAfterLogin(user);
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

      await redirectAfterLogin(user);
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
          <button className="social-button google-btn" 
            type="button" 
            onClick={handleGoogleLogin}
          >
            <img src="/src/assets/images/logos/google-logo.png" alt="Google Logo" className="social-logo" />
            Continue with Google
          </button>
          <button className="social-button facebook-btn"
            type="button" 
            onClick={handleFacebookLogin}
          >
            <img src="/src/assets/images/logos/Facebook_logo.svg" alt="Facebook Logo" className="social-logo" />
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
              onChange={(e) => {
                if (!validateEmail(e.target.value)) {
                  setEmailError('Please enter a valid email');
                } else {
                  setEmailError('');
                }
              }}
            />
            {emailError && <div className="validation-error">{emailError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Enter your password"
              required
              onChange={(e) => {
                if (!validatePassword(e.target.value)) {
                  setPasswordError('Password must be at least 8 characters');
                } else {
                  setPasswordError('');
                }
              }}
            />
            {passwordError && <div className="validation-error">{passwordError}</div>}
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

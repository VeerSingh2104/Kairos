import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, facebookProvider } from '../../firebase'
import Session from '../../models/Session'
import '../../styles/components/auth.css'

function Signup() {
  const { role } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateName = (name) => {
    return name.length >= 2; // Minimum 2 characters
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8; // Minimum 8 characters
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirmPassword = e.target['confirm-password'].value;

    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setError('');

    // Validate inputs
    if (!validateName(name)) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    try {
      // Handle signup logic here
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      navigate('/auth/success', { replace: true });
    } catch (error) {
      console.error('Signup error:', error);
      setError('Signup not successful: ' + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Successful login - redirect to dashboard
      navigate(`/${role}/dashboard`, { replace: true });
    } catch (error) {
      console.error('Google login error:', error);
      let errorMessage = 'Failed to login with Google';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login popup was closed - please try again';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'This email is already registered with another method';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleFacebookLogin = async () => {
    try {
      setLoading(true)
      const result = await signInWithPopup(auth, facebookProvider)
      const user = result.user
      
      const session = new Session({
        userId: user.uid,
        token: user.accessToken,
        expiresAt: new Date(Date.now() + 3600000),
        userAgent: navigator.userAgent
      })
      await session.save()
      
      navigate(`/${role}/dashboard`, { replace: true })
    } catch (error) {
      console.error('Facebook login error:', error)
      setError('Failed to login with Facebook')
    } finally {
      setLoading(false)
    }
  }


  return (
    <section className="auth-section">
      <div className="container">
        <h2>Sign up as {role}</h2>
        
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
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Enter your full name"
              required
              onChange={(e) => {
                if (!validateName(e.target.value)) {
                  setNameError('Name must be at least 2 characters');
                } else {
                  setNameError('');
                }
              }}
            />
            {nameError && <div className="validation-error">{nameError}</div>}
          </div>
          
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
              placeholder="Create a password"
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
          
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input 
              type="password" 
              id="confirm-password" 
              placeholder="Confirm your password"
              required
              onChange={(e) => {
                if (e.target.value !== document.getElementById('password').value) {
                  setConfirmPasswordError('Passwords do not match');
                } else {
                  setConfirmPasswordError('');
                }
              }}
            />
            {confirmPasswordError && <div className="validation-error">{confirmPasswordError}</div>}
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

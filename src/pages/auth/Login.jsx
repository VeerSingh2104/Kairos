import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import User from '../../models/User';
import '../../styles/components/auth.css';

export default function Login() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finishLogin = async (user) => {
    const record = await User.getById(user.uid);

    if (!record) {
      await User.create(user.uid, {
        role,
        email: user.email || '',
        name: user.displayName || '',
      });
      navigate('/profile-setup', { replace: true });
      return;
    }

    if (record.role !== role) {
      await auth.signOut();
      throw new Error(`This account belongs to the ${record.role} role.`);
    }

    navigate(record.profileComplete ? `/${role}/dashboard` : '/profile-setup', { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(event.currentTarget);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(
        auth,
        String(form.get('email')).trim(),
        String(form.get('password'))
      );
      await finishLogin(credential.user);
    } catch (err) {
      const messages = {
        'auth/invalid-credential': 'Email or password is incorrect.',
        'auth/user-not-found': 'No account was found with this email.',
        'auth/wrong-password': 'Email or password is incorrect.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      };
      setError(messages[err.code] || err.message || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    setError('');

    try {
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithPopup(auth, googleProvider);
      await finishLogin(credential.user);
    } catch (err) {
      const messages = {
        'auth/popup-closed-by-user': 'The Google sign-in window was closed before login finished.',
        'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method.',
        'auth/unauthorized-domain': 'This site is not authorized for Google sign-in in Firebase.',
        'auth/cancelled-popup-request': 'Another Google sign-in window is already open.',
      };
      setError(messages[err.code] || err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="container auth-card">
        <button className="auth-back" onClick={() => navigate('/auth/role-selection?action=login')}>Back</button>
        <p className="eyebrow">KAIROS LOGIN</p>
        <h2>Welcome back</h2>
        <p className="lead">Continue as a {role}.</p>
        {error && <div className="auth-error">{error}</div>}
        <button className="social-button google-btn" type="button" onClick={google} disabled={loading}>
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>
        <div className="auth-divider"><span>OR</span></div>
        <form className="auth-form" onSubmit={submit}>
          <div className="form-group"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required placeholder="you@example.com" /></div>
          <div className="form-group"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required placeholder="Your password" /></div>
          <button className="submit-btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
        </form>
        <p className="auth-switch">New to Kairos? <button onClick={() => navigate(`/auth/signup/${role}`)}>Create account</button></p>
      </div>
    </section>
  );
}

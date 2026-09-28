import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import User from '../../models/User';
import '../../styles/components/auth.css';

export default function Signup() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finish = async (user, name = '') => {
    const existing = await User.getById(user.uid);
    if (existing && existing.role !== role) {
      throw new Error(`This account is already registered as ${existing.role}.`);
    }
    if (!existing) {
      await User.create(user.uid, {
        role,
        email: user.email || '',
        name: name || user.displayName || ''
      });
    }
    navigate('/profile-setup', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const confirm = String(form.get('confirmPassword') || '');

    if (name.length < 2) { setError('Please enter your full name.'); setLoading(false); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return; }
    if (password !== confirm) { setError('Passwords do not match.'); setLoading(false); return; }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await finish(credential.user, name);
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Choose a stronger password.'
      };
      setError(messages[err.code] || err.message || 'Unable to create the account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await finish(credential.user, credential.user.displayName || '');
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="container auth-card">
        <button className="auth-back" onClick={() => navigate('/auth/role-selection?action=signup')}>Back</button>
        <p className="eyebrow">KAIROS ACCOUNT</p>
        <h2>Create your {role} account</h2>
        <p className="lead">Build your profile once, then use the workspace for your role.</p>
        {error && <div className="auth-error">{error}</div>}
        <button className="social-button google-btn" type="button" onClick={handleGoogle} disabled={loading}>Continue with Google</button>
        <div className="auth-divider"><span>OR</span></div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group"><label htmlFor="name">Full name</label><input id="name" name="name" required placeholder="Lakshya Veer Singh" /></div>
          <div className="form-group"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required placeholder="you@example.com" /></div>
          <div className="form-group"><label htmlFor="password">Password</label><input id="password" name="password" type="password" minLength="8" required placeholder="At least 8 characters" /></div>
          <div className="form-group"><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" minLength="8" required placeholder="Repeat your password" /></div>
          <button className="submit-btn" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</button>
        </form>
        <p className="auth-switch">Already have an account? <button onClick={() => navigate(`/auth/login/${role}`)}>Login</button></p>
      </div>
    </section>
  );
}

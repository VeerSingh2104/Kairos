import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import User from '../models/User';

export default function ProtectedRoute({ role, children }) {
  const [state, setState] = useState({ loading: true, user: null, profile: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, user: null, profile: null });
        return;
      }
      try {
        const profile = await User.getById(user.uid);
        setState({ loading: false, user, profile });
      } catch (error) {
        console.error('Protected route error:', error);
        setState({ loading: false, user, profile: null });
      }
    });
    return unsubscribe;
  }, []);

  if (state.loading) return <div className="route-loading">Loading Kairos...</div>;
  if (!state.user || !state.profile) return <Navigate to={`/auth/login/${role}`} replace />;
  if (state.profile.role !== role) return <Navigate to={`/${state.profile.role}/dashboard`} replace />;
  if (state.profile.status === 'suspended') return <div className="route-loading">This account has been suspended.</div>;
  if (!state.profile.profileComplete) return <Navigate to="/profile-setup" replace />;

  return children;
}

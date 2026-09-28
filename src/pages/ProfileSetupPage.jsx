import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import User from '../models/User';
import ProfileSetup from '../components/ProfileSetup';
import '../styles/components/components.css';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/auth/role-selection?action=signup', { replace: true });
        return;
      }
      try {
        const data = await User.getById(user.uid);
        if (!data) throw new Error('Your account profile could not be found.');
        setRecord(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
  }, [navigate]);

  const complete = async (profileData) => {
    if (!auth.currentUser || !record) return;
    setError('');
    try {
      await User.updateProfile(auth.currentUser.uid, profileData);
      await User.markProfileComplete(auth.currentUser.uid, true);
      navigate(`/${record.role}/dashboard`, { replace: true });
    } catch (err) {
      console.error(err);
      setError('We could not save your profile. Check your connection and try again.');
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate('/', { replace: true });
  };

  if (loading) return <div className="route-loading">Loading profile setup...</div>;
  if (!record) return <div className="route-loading">{error || 'Profile unavailable.'}</div>;

  return (
    <div className="profile-page-shell">
      {error && <div className="profile-save-error">{error}</div>}
      <ProfileSetup autofillData={record.profileData} onComplete={complete} onLogout={logout} />
    </div>
  );
}

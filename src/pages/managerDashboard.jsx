import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import ResumeAnalyzer from '../components/ResumeAnalyzer';
import '../styles/components/components.css';

const db = getFirestore();

function ManagerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRole(data.role || data.userRole || null);
        }
      } else {
        navigate('/auth/login/manager');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Manager Dashboard</h1>
        <button 
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>
      
      <main>
        {user && (
          <>
            <p>Welcome to your manager dashboard</p>
            {role === 'manager' && <ResumeAnalyzer />}
          </>
        )}
      </main>
    </div>
  );
}

export default ManagerDashboard;

import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import '../../styles/components/dashboard.css';

function ManagerDashboard() {
  const navigate = useNavigate();

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
        <p>Welcome to your manager dashboard</p>
      </main>
    </div>
  );
}

export default ManagerDashboard;

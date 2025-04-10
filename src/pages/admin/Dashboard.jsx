import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import '../../styles/components/admin.css';

function AdminDashboard() {
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
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button 
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>
      
      <main>
        {/* Admin dashboard content will go here */}
        <p>Welcome to the admin dashboard</p>
      </main>
    </div>
  );
}

export default AdminDashboard;

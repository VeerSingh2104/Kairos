import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import '../styles/components/navbar.css';
import '../styles/components/dashboard.css';

const Navbar = () => {
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
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo">Kairos</div>
        <div className="nav-right-group">
        <button className="login-btn" onClick={handleLogout}>
            Logout
        </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSetup from '../components/ProfileSetup';
import User from '../models/User';
import { auth } from '../firebase';

const ProfileSetupPage = () => {
  const navigate = useNavigate();

  const handleComplete = async (profileData) => {
    try {
      const userId = auth.currentUser.uid;
      await User.updateProfile(userId, profileData);
      await User.markProfileComplete(userId);
      navigate(`/${profileData.role || 'candidate'}/dashboard`, { replace: true });
    } catch (error) {
      console.error('Error completing profile setup:', error);
      // Optionally show error to user
    }
  };

  return (
    <div>
      <ProfileSetup onComplete={handleComplete} />
    </div>
  );
};

export default ProfileSetupPage;

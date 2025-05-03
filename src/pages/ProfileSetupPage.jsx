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
      console.log('Saving profile data for user:', userId, profileData);
      await User.updateProfile(userId, profileData);
      console.log('Profile data saved successfully');
      await User.markProfileComplete(userId);
      console.log('Profile marked as complete');

      // Re-fetch user data to confirm profileComplete flag
      const updatedUser = await User.getById(userId);
      if (updatedUser && updatedUser.profileComplete) {
        console.log('Confirmed profileComplete flag is set');
        navigate(`/${profileData.role || 'candidate'}/dashboard`, { replace: true });
      } else {
        console.warn('ProfileComplete flag not set yet, retrying navigation');
        // Optionally retry or show message
        navigate(`/${profileData.role || 'candidate'}/dashboard`, { replace: true });
      }
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

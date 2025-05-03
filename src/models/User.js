// User model using Firebase Firestore
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '../firebase';

const db = getFirestore(firebaseApp);

const defaultProfileData = {
  fullName: '',
  jobTitle: '',
  skills: [],
  bio: '',
  avatar: null,
  completedSteps: 0,
  totalSteps: 5
};

const usersCollection = collection(db, 'users');

const User = {
  async create(userId, userData) {
    try {
      const userWithProfile = {
        ...userData,
        profileComplete: false,
        profileData: defaultProfileData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await setDoc(doc(usersCollection, userId), userWithProfile);
      return userId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const userRef = doc(usersCollection, id);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  async updateProfile(userId, profileData) {
    try {
      console.log(`Updating profile for user ${userId} with data:`, profileData);
      await updateDoc(doc(usersCollection, userId), {
        profileData,
        updatedAt: new Date()
      });
      console.log(`Profile updated successfully for user ${userId}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async markProfileComplete(userId) {
    try {
      await updateDoc(doc(usersCollection, userId), {
        'profileComplete': true,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking profile complete:', error);
      throw error;
    }
  }
};

export default User;
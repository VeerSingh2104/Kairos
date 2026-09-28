import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseApp } from '../firebase';

const db = getFirestore(firebaseApp);
const usersCollection = collection(db, 'users');

const emptyProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  headline: '',
  location: '',
  bio: '',
  education: [],
  experience: [],
  skills: [],
};

const User = {
  async create(uid, { role, email = '', name = '' }) {
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    const profile = {
      ...emptyProfile,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' '),
      email,
    };

    await setDoc(doc(usersCollection, uid), {
      uid,
      role,
      profileComplete: false,
      profileData: profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return uid;
  },

  async getById(uid) {
    const snapshot = await getDoc(doc(usersCollection, uid));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  },

  async updateProfile(uid, profileData) {
    await updateDoc(doc(usersCollection, uid), {
      profileData,
      updatedAt: serverTimestamp(),
    });
  },

  async markProfileComplete(uid, complete = true) {
    await updateDoc(doc(usersCollection, uid), {
      profileComplete: complete,
      updatedAt: serverTimestamp(),
    });
  },

  async ensureProfile(uid, authUser, role) {
    const existing = await User.getById(uid);
    if (existing) return existing;

    await User.create(uid, {
      role,
      email: authUser.email || '',
      name: authUser.displayName || '',
    });

    return User.getById(uid);
  },
};

export default User;

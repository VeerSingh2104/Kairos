// Session model using Firebase Firestore
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBGkHZEIKNmh1LAXu1D6kn02eUqSjhIE7M",
  authDomain: "kairos-cc7cd.firebaseapp.com",
  projectId: "kairos-cc7cd",
  storageBucket: "kairos-cc7cd.firebasestorage.app",
  messagingSenderId: "396286230303",
  appId: "1:396286230303:web:472ca65acd99087ab47a2a",
  measurementId: "G-0CL6WV9YSY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const sessionsCollection = collection(db, 'sessions');

const Session = {
  async create(sessionData) {
    try {
      const sessionRef = doc(sessionsCollection);
      await setDoc(sessionRef, {
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return sessionRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const sessionRef = doc(sessionsCollection, id);
      const sessionSnap = await getDoc(sessionRef);
      return sessionSnap.exists() ? { id: sessionSnap.id, ...sessionSnap.data() } : null;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }
};

export default Session;

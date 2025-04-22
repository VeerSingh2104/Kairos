// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

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

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { app as firebaseApp, auth, googleProvider, facebookProvider };

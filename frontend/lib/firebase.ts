import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnEVEBwC0a_iEfAzVXYp36bbyN44bbHNk",
  authDomain: "zerodhaai.firebaseapp.com",
  projectId: "zerodhaai",
  storageBucket: "zerodhaai.firebasestorage.app",
  messagingSenderId: "569051494429",
  appId: "1:569051494429:web:a9e0cf5c253f09dd31aef4",
  measurementId: "G-J8P3R1B5GZ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
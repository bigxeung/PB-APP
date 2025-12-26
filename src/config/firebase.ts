// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA_uewW7-4xynOCKNn07AzOipQpoioq5os",
  authDomain: "my-lora-auth.firebaseapp.com",
  projectId: "my-lora-auth",
  storageBucket: "my-lora-auth.firebasestorage.app",
  messagingSenderId: "17587805020",
  appId: "1:17587805020:web:580bfd5ae1340b9f8cbf99",
  measurementId: "G-9S9T0X13T1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };

/**
 * Firebase Authentication Service
 *
 * Handles email/password and social login (Google, GitHub, etc.)
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
  AuthCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get Firebase ID Token
    const idToken = await user.getIdToken();

    // Send to backend to get JWT tokens
    const response = await apiClient.post('/api/auth/firebase', { idToken });

    if (response.data.success) {
      // Save JWT tokens
      await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);

      return {
        success: true,
        user: response.data.data.user,
        firebaseUser: user,
      };
    }

    return { success: false, error: response.data.error };
  } catch (error: any) {
    console.error('Sign up error:', error);

    // Firebase error handling
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Email is already in use' };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password should be at least 6 characters' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email format' };
    }

    return { success: false, error: 'Sign up failed' };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get Firebase ID Token
    const idToken = await user.getIdToken();

    // Send to backend to get JWT tokens
    const response = await apiClient.post('/api/auth/firebase', { idToken });

    if (response.data.success) {
      // Save JWT tokens
      await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);

      return {
        success: true,
        user: response.data.data.user,
        firebaseUser: user,
      };
    }

    return { success: false, error: response.data.error };
  } catch (error: any) {
    console.error('Sign in error:', error);

    // Firebase error handling
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return { success: false, error: 'Invalid email or password' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email format' };
    } else if (error.code === 'auth/user-disabled') {
      return { success: false, error: 'Account has been disabled' };
    }

    return { success: false, error: 'Sign in failed' };
  }
};

/**
 * Sign in with Google
 *
 * Note: For React Native, you need to use @react-native-google-signin/google-signin
 * or expo-auth-session for OAuth flow
 */
export const signInWithGoogle = async (credential: AuthCredential) => {
  try {
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Get Firebase ID Token
    const idToken = await user.getIdToken();

    // Send to backend to get JWT tokens
    const response = await apiClient.post('/api/auth/firebase', { idToken });

    if (response.data.success) {
      // Save JWT tokens
      await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);

      return {
        success: true,
        user: response.data.data.user,
        firebaseUser: user,
      };
    }

    return { success: false, error: response.data.error };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    return { success: false, error: 'Google sign in failed' };
  }
};

/**
 * Sign out
 */
export const firebaseSignOut = async () => {
  try {
    await signOut(auth);

    // Also clear JWT tokens
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');

    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error };
  }
};

/**
 * Get current Firebase user
 */
export const getCurrentFirebaseUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

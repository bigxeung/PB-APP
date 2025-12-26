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
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

/**
 * Check if email already exists
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    return signInMethods.length > 0;
  } catch (error: any) {
    console.error('Error checking email:', error);
    // If there's an error, return false to allow the sign-up attempt
    // (Firebase will handle the actual validation)
    return false;
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    console.log('🔵 Step 1: Creating Firebase user with email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Step 1 Success: Firebase user created:', user.uid);

    // Get Firebase ID Token
    console.log('🔵 Step 2: Getting Firebase ID token...');
    const idToken = await user.getIdToken();
    console.log('✅ Step 2 Success: Firebase ID token obtained');

    // Send to backend to get JWT tokens
    console.log('🔵 Step 3: Sending to backend /api/auth/firebase...');
    const response = await apiClient.post('/api/auth/firebase', { idToken });
    console.log('✅ Step 3 Success: Backend response received:', response.data);

    if (response.data.success) {
      console.log('🔵 Step 4: Returning tokens and user data...');
      // Return tokens and user data (LoginScreen will handle saving via login())
      return {
        success: true,
        user: response.data.data.user,
        firebaseUser: user,
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
      };
    }

    console.log('❌ Backend returned success: false');
    return { success: false, error: response.data.error || response.data.message };
  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Backend API error handling (Axios errors)
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 409) {
        return { success: false, error: 'This email is already registered with another method' };
      } else if (status === 400) {
        return { success: false, error: message || 'Invalid request' };
      } else if (status === 500) {
        return { success: false, error: 'Server error. Please try again later.' };
      }

      return { success: false, error: message || 'Sign up failed' };
    }

    // Firebase error handling
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Email is already in use' };
    } else if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password should be at least 6 characters' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email format' };
    }

    return { success: false, error: error.message || 'Sign up failed' };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('🔵 Step 1: Signing in with Firebase email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Step 1 Success: Firebase sign in successful:', user.uid);

    // Get Firebase ID Token
    console.log('🔵 Step 2: Getting Firebase ID token...');
    const idToken = await user.getIdToken();
    console.log('✅ Step 2 Success: Firebase ID token obtained');

    // Send to backend to get JWT tokens
    console.log('🔵 Step 3: Sending to backend /api/auth/firebase...');
    const response = await apiClient.post('/api/auth/firebase', { idToken });
    console.log('✅ Step 3 Success: Backend response received:', response.data);

    if (response.data.success) {
      console.log('🔵 Step 4: Returning tokens and user data...');
      // Return tokens and user data (LoginScreen will handle saving via login())
      return {
        success: true,
        user: response.data.data.user,
        firebaseUser: user,
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
      };
    }

    console.log('❌ Backend returned success: false');
    return { success: false, error: response.data.error || response.data.message };
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Backend API error handling (Axios errors)
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 400) {
        return { success: false, error: message || 'Invalid request' };
      } else if (status === 404) {
        return { success: false, error: 'User not found' };
      } else if (status === 500) {
        return { success: false, error: 'Server error. Please try again later.' };
      }

      return { success: false, error: message || 'Sign in failed' };
    }

    // Firebase error handling
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return { success: false, error: 'Invalid email or password' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email format' };
    } else if (error.code === 'auth/user-disabled') {
      return { success: false, error: 'Account has been disabled' };
    }

    return { success: false, error: error.message || 'Sign in failed' };
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

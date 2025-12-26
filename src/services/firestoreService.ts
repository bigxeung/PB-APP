/**
 * Firestore Database Service
 *
 * Handles data synchronization between backend and Firestore
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
  DocumentReference,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserResponse, Model, Generation, Training } from '../types';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  MODELS: 'models',
  GENERATIONS: 'generations',
  TRAININGS: 'trainings',
  FAVORITES: 'favorites',
} as const;

// User Profile Management
export const firestoreUserAPI = {
  /**
   * Get user profile from Firestore
   */
  async getProfile(userId: string): Promise<UserResponse | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserResponse;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  /**
   * Create or update user profile in Firestore
   */
  async setProfile(userId: string, userData: Partial<UserResponse>): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await setDoc(userRef, {
        ...userData,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error setting user profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile fields
   */
  async updateProfile(userId: string, updates: Partial<UserResponse>): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Listen to user profile changes in real-time
   */
  onProfileChange(userId: string, callback: (user: UserResponse | null) => void): () => void {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserResponse);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to user profile:', error);
      callback(null);
    });
  },
};

// Model Management
export const firestoreModelAPI = {
  /**
   * Get model by ID
   */
  async getModel(modelId: string): Promise<Model | null> {
    try {
      const modelDoc = await getDoc(doc(db, COLLECTIONS.MODELS, modelId));
      if (modelDoc.exists()) {
        return modelDoc.data() as Model;
      }
      return null;
    } catch (error) {
      console.error('Error getting model:', error);
      throw error;
    }
  },

  /**
   * Save model to Firestore
   */
  async saveModel(modelId: string, modelData: Partial<Model>): Promise<void> {
    try {
      const modelRef = doc(db, COLLECTIONS.MODELS, modelId);
      await setDoc(modelRef, {
        ...modelData,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving model:', error);
      throw error;
    }
  },

  /**
   * Get user's models
   */
  async getUserModels(userId: string): Promise<Model[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.MODELS),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Model);
    } catch (error) {
      console.error('Error getting user models:', error);
      throw error;
    }
  },

  /**
   * Delete model from Firestore
   */
  async deleteModel(modelId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.MODELS, modelId));
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  },
};

// Generation History Management
export const firestoreGenerationAPI = {
  /**
   * Save generation to Firestore
   */
  async saveGeneration(generationId: string, generationData: Partial<Generation>): Promise<void> {
    try {
      const genRef = doc(db, COLLECTIONS.GENERATIONS, generationId);
      await setDoc(genRef, {
        ...generationData,
        createdAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving generation:', error);
      throw error;
    }
  },

  /**
   * Get user's generation history
   */
  async getUserGenerations(userId: string, limitCount: number = 50): Promise<Generation[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.GENERATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Generation);
    } catch (error) {
      console.error('Error getting user generations:', error);
      throw error;
    }
  },

  /**
   * Delete generation from Firestore
   */
  async deleteGeneration(generationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.GENERATIONS, generationId));
    } catch (error) {
      console.error('Error deleting generation:', error);
      throw error;
    }
  },

  /**
   * Listen to user's generation history in real-time
   */
  onGenerationsChange(userId: string, callback: (generations: Generation[]) => void): () => void {
    const q = query(
      collection(db, COLLECTIONS.GENERATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const generations = snapshot.docs.map(doc => doc.data() as Generation);
      callback(generations);
    }, (error) => {
      console.error('Error listening to generations:', error);
      callback([]);
    });
  },
};

// Training History Management
export const firestoreTrainingAPI = {
  /**
   * Save training to Firestore
   */
  async saveTraining(trainingId: string, trainingData: Partial<Training>): Promise<void> {
    try {
      const trainRef = doc(db, COLLECTIONS.TRAININGS, trainingId);
      await setDoc(trainRef, {
        ...trainingData,
        createdAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving training:', error);
      throw error;
    }
  },

  /**
   * Get user's training history
   */
  async getUserTrainings(userId: string, limitCount: number = 50): Promise<Training[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TRAININGS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Training);
    } catch (error) {
      console.error('Error getting user trainings:', error);
      throw error;
    }
  },

  /**
   * Update training status
   */
  async updateTrainingStatus(trainingId: string, status: string, progress?: number): Promise<void> {
    try {
      const trainRef = doc(db, COLLECTIONS.TRAININGS, trainingId);
      await updateDoc(trainRef, {
        status,
        ...(progress !== undefined && { progress }),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating training status:', error);
      throw error;
    }
  },

  /**
   * Listen to training status changes in real-time
   */
  onTrainingChange(trainingId: string, callback: (training: Training | null) => void): () => void {
    const trainRef = doc(db, COLLECTIONS.TRAININGS, trainingId);
    return onSnapshot(trainRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as Training);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to training:', error);
      callback(null);
    });
  },
};

// Favorites Management
export const firestoreFavoritesAPI = {
  /**
   * Add model to favorites
   */
  async addFavorite(userId: string, modelId: string): Promise<void> {
    try {
      const favRef = doc(db, COLLECTIONS.FAVORITES, `${userId}_${modelId}`);
      await setDoc(favRef, {
        userId,
        modelId,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  /**
   * Remove model from favorites
   */
  async removeFavorite(userId: string, modelId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.FAVORITES, `${userId}_${modelId}`));
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  },

  /**
   * Get user's favorite model IDs
   */
  async getUserFavorites(userId: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.FAVORITES),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().modelId);
    } catch (error) {
      console.error('Error getting user favorites:', error);
      throw error;
    }
  },

  /**
   * Check if model is favorited
   */
  async isFavorited(userId: string, modelId: string): Promise<boolean> {
    try {
      const favDoc = await getDoc(doc(db, COLLECTIONS.FAVORITES, `${userId}_${modelId}`));
      return favDoc.exists();
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  },

  /**
   * Listen to user's favorites in real-time
   */
  onFavoritesChange(userId: string, callback: (favoriteIds: string[]) => void): () => void {
    const q = query(
      collection(db, COLLECTIONS.FAVORITES),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const favoriteIds = snapshot.docs.map(doc => doc.data().modelId);
      callback(favoriteIds);
    }, (error) => {
      console.error('Error listening to favorites:', error);
      callback([]);
    });
  },
};

// Sync utilities
export const firestoreSyncAPI = {
  /**
   * Sync user data from backend to Firestore
   */
  async syncUserData(userId: string, userData: UserResponse): Promise<void> {
    try {
      await firestoreUserAPI.setProfile(userId, userData);
      console.log('✅ User data synced to Firestore');
    } catch (error) {
      console.error('❌ Failed to sync user data:', error);
      throw error;
    }
  },

  /**
   * Sync model data from backend to Firestore
   */
  async syncModelData(modelId: string, modelData: Model): Promise<void> {
    try {
      await firestoreModelAPI.saveModel(modelId, modelData);
      console.log('✅ Model data synced to Firestore');
    } catch (error) {
      console.error('❌ Failed to sync model data:', error);
      throw error;
    }
  },

  /**
   * Batch sync multiple models
   */
  async syncModels(models: Model[]): Promise<void> {
    try {
      const promises = models.map(model =>
        firestoreModelAPI.saveModel(model.id, model)
      );
      await Promise.all(promises);
      console.log(`✅ ${models.length} models synced to Firestore`);
    } catch (error) {
      console.error('❌ Failed to sync models:', error);
      throw error;
    }
  },
};

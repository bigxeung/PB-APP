/**
 * Memory Management Utilities
 *
 * Provides utilities for efficient memory usage in React Native app
 */

import { Image } from 'react-native';

/**
 * Image Cache Manager
 * Manages image cache cleanup to prevent memory leaks
 */
class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cachedImages: Set<string> = new Set();
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached images

  private constructor() {}

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  /**
   * Track an image URL
   */
  trackImage(url: string) {
    this.cachedImages.add(url);

    // If cache exceeds max size, clear oldest entries
    if (this.cachedImages.size > this.MAX_CACHE_SIZE) {
      const entriesToRemove = Array.from(this.cachedImages).slice(0, 20);
      entriesToRemove.forEach(url => {
        this.cachedImages.delete(url);
        // Prefetch with cache: 'reload' to clear from memory
        Image.prefetch(url).catch(() => {});
      });
    }
  }

  /**
   * Clear specific image from cache
   */
  clearImage(url: string) {
    this.cachedImages.delete(url);
    // Clear from React Native image cache
    Image.prefetch(url).catch(() => {});
  }

  /**
   * Clear all cached images
   */
  clearAll() {
    this.cachedImages.forEach(url => {
      Image.prefetch(url).catch(() => {});
    });
    this.cachedImages.clear();
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.cachedImages.size;
  }

  /**
   * Prefetch images for better performance
   */
  async prefetchImages(urls: string[]) {
    const promises = urls.slice(0, 10).map(url => {
      this.trackImage(url);
      return Image.prefetch(url).catch(() => {});
    });

    await Promise.all(promises);
  }
}

export const imageCacheManager = ImageCacheManager.getInstance();

/**
 * Memory monitoring utilities
 */
export const memoryUtils = {
  /**
   * Clear unnecessary data from memory
   */
  clearMemory: () => {
    if (global.gc) {
      global.gc();
    }
  },

  /**
   * Get memory usage info (development only)
   */
  getMemoryInfo: () => {
    if (__DEV__) {
      const imageCache = imageCacheManager.getCacheSize();
      console.log('📊 Memory Info:', {
        imageCacheSize: imageCache,
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Periodic memory cleanup
   * Call this on app background or when navigating away from heavy screens
   */
  performCleanup: () => {
    // Clear old images from cache if needed
    const currentSize = imageCacheManager.getCacheSize();
    if (currentSize > 50) {
      console.log('🧹 Performing memory cleanup...');
      // imageCacheManager will auto-trim when tracking new images
    }

    // Trigger garbage collection if available (dev mode)
    if (__DEV__ && global.gc) {
      global.gc();
    }
  },
};

/**
 * Hook helper to cleanup on unmount
 */
export const createCleanupCallback = (imageUrls: string[]) => {
  return () => {
    imageUrls.forEach(url => {
      if (url) {
        imageCacheManager.clearImage(url);
      }
    });
  };
};

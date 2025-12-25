import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { imageCacheManager, memoryUtils } from '@/utils/memory';

/**
 * Hook for automatic memory cleanup on component unmount
 *
 * Usage:
 * ```tsx
 * const MyComponent = () => {
 *   const imageUrls = models.map(m => m.thumbnailUrl);
 *   useMemoryCleanup(imageUrls);
 *   // ...
 * }
 * ```
 */
export const useMemoryCleanup = (imageUrls: string[]) => {
  useEffect(() => {
    // Track images when component mounts
    imageUrls.forEach(url => {
      if (url) {
        imageCacheManager.trackImage(url);
      }
    });

    // Cleanup when component unmounts
    return () => {
      imageUrls.forEach(url => {
        if (url) {
          imageCacheManager.clearImage(url);
        }
      });
    };
  }, [imageUrls.join(',')]); // Re-run if URLs change
};

/**
 * Hook for handling app background state and memory cleanup
 *
 * Automatically performs memory cleanup when app goes to background
 */
export const useAppStateMemoryCleanup = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // App is going to background
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        console.log('🔄 App going to background, performing cleanup...');
        memoryUtils.performCleanup();
      }

      // App is coming to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('✅ App coming to foreground');
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
};

/**
 * Hook for prefetching images
 *
 * Prefetches images for better performance when scrolling
 */
export const usePrefetchImages = (imageUrls: string[], enabled: boolean = true) => {
  useEffect(() => {
    if (enabled && imageUrls.length > 0) {
      imageCacheManager.prefetchImages(imageUrls);
    }
  }, [imageUrls.join(','), enabled]);
};

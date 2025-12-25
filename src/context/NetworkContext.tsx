import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useToast } from './ToastContext';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [hasShownOfflineToast, setHasShownOfflineToast] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable ?? false;

      setIsConnected(connected);
      setIsInternetReachable(reachable);

      // 오프라인 상태가 되면 Toast 표시
      if (!connected || !reachable) {
        if (!hasShownOfflineToast) {
          toast.warning('You are offline. Some features may not work.');
          setHasShownOfflineToast(true);
        }
      } else {
        // 다시 온라인이 되면
        if (hasShownOfflineToast) {
          toast.success('Back online!');
          setHasShownOfflineToast(false);
        }
      }
    });

    return () => unsubscribe();
  }, [hasShownOfflineToast]);

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
      {children}
    </NetworkContext.Provider>
  );
};

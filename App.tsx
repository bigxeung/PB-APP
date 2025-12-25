import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useAppStateMemoryCleanup } from './src/hooks/useMemoryCleanup';

function AppContent() {
  // Global memory cleanup when app goes to background
  useAppStateMemoryCleanup();

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1D" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <NetworkProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </NetworkProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

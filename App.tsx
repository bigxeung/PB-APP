import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar barStyle="light-content" backgroundColor="#1A1A1D" />
          <AppNavigator />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  API_BASE_URL as ENV_API_BASE_URL,
  GOOGLE_WEB_CLIENT_ID as ENV_GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID as ENV_GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID as ENV_GOOGLE_ANDROID_CLIENT_ID,
} from '@env';

// WebBrowser 완료 처리
WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = ENV_API_BASE_URL || 'https://d3ka730j70ocy8.cloudfront.net';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  // Google OAuth 설정 (expo-auth-session)
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: ENV_GOOGLE_WEB_CLIENT_ID,
    iosClientId: ENV_GOOGLE_IOS_CLIENT_ID,
    androidClientId: ENV_GOOGLE_ANDROID_CLIENT_ID,
  });

  // Google OAuth 응답 처리
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    }
  }, [response]);

  const handleGoogleResponse = async (googleResponse: any) => {
    try {
      setIsLoading(true);
      console.log('✅ Google OAuth success:', googleResponse);

      // Google ID Token 추출
      const { authentication } = googleResponse;
      const idToken = authentication?.idToken;

      if (!idToken) {
        console.error('❌ No ID token received from Google');
        alert('Login failed. No ID token received.');
        setIsLoading(false);
        return;
      }

      console.log('🔑 Sending ID token to backend...');

      // 백엔드로 Google ID Token 전송하여 JWT 발급
      const response = await fetch(`${API_BASE_URL}/api/auth/google/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Backend authentication failed:', error);
        alert(`Login failed: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('✅ Backend JWT received:', data);

      // JWT 토큰으로 로그인
      const { accessToken, refreshToken } = data.data || data;
      await login(accessToken, refreshToken);

      console.log('✅ Login successful!');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Google login error:', error);
      alert('Login failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('🚀 Starting Google login...');
      setIsLoading(true);

      // expo-auth-session으로 Google OAuth 시작
      await promptAsync();
    } catch (error) {
      console.error('❌ Failed to start Google login:', error);
      alert('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Blueming AI</Text>
        <Text style={styles.subtitle}>AI Image Generation Platform</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="images" size={100} color="#3B82F6" />
        </View>
        <Text style={styles.description}>
          Create amazing AI art with{'\n'}
          custom LoRA models
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="brush" size={24} color="#3B82F6" />
            <Text style={styles.featureText}>Train Models</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="image" size={24} color="#3B82F6" />
            <Text style={styles.featureText}>Generate Art</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={24} color="#3B82F6" />
            <Text style={styles.featureText}>Share & Discover</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color="#fff" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our{'\n'}
          Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1D',
    padding: 20,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#BDBDBD',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 18,
    color: '#BDBDBD',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  features: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 20,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  footer: {
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  termsText: {
    fontSize: 12,
    color: '#828282',
    textAlign: 'center',
    lineHeight: 18,
  },
});

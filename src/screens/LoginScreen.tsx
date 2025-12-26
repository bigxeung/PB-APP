import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { signUpWithEmail, signInWithEmail } from '../services/firebaseAuth';
import {
  API_BASE_URL as ENV_API_BASE_URL,
  GOOGLE_WEB_CLIENT_ID as ENV_GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID as ENV_GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID as ENV_GOOGLE_ANDROID_CLIENT_ID,
} from '@env';

// WebBrowser 완료 처리
WebBrowser.maybeCompleteAuthSession();

// iOS에서 외부 브라우저 사용을 위한 warm up
if (Platform.OS === 'ios') {
  WebBrowser.warmUpAsync();
}

const API_BASE_URL = ENV_API_BASE_URL || 'https://d3ka730j70ocy8.cloudfront.net';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginMode, setLoginMode] = React.useState<'google' | 'email'>('google');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);

  // Google OAuth URL 생성 함수 (iOS Client ID + custom scheme)
  const getGoogleAuthUrl = () => {
    const REDIRECT_URI = 'com.googleusercontent.apps.990214424232-d5cp28kokad960fb4ioalgp7c9m80vu2:/oauth2redirect';
    const state = `mobile_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${ENV_GOOGLE_IOS_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=openid%20email%20profile&state=${state}&prompt=consent`,
      redirectUri: REDIRECT_URI,
    };
  };

  const handleAuthCallback = async (url: string, redirectUri: string) => {
    try {
      console.log('📨 Auth callback URL:', url);

      // URL에서 authorization code 추출
      const match = url.match(/code=([^&]+)/);
      if (!match) {
        console.error('❌ No authorization code found');
        alert('Login failed. No authorization code received.');
        setIsLoading(false);
        return;
      }

      const code = decodeURIComponent(match[1]);
      console.log('🔑 Authorization code received');

      // Step 1: Google에서 ID token 받기
      console.log('🔄 Exchanging code for tokens...');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: ENV_GOOGLE_IOS_CLIENT_ID,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        console.error('❌ Token exchange failed:', error);
        alert(`Token exchange failed: ${error.error_description || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      const tokens = await tokenResponse.json();
      const googleIdToken = tokens.id_token;
      console.log('✅ ID token received from Google');

      // Step 2: Firebase로 Google 자격증명 로그인
      console.log('🔄 Signing in to Firebase with Google credential...');
      const credential = GoogleAuthProvider.credential(googleIdToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;
      console.log('✅ Firebase sign-in successful:', firebaseUser.uid);

      // Step 3: Firebase ID token 가져오기
      const firebaseIdToken = await firebaseUser.getIdToken();
      console.log('✅ Firebase ID token received');

      // Step 4: 백엔드로 Firebase ID token 전송하여 JWT 발급
      const response = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: firebaseIdToken }),
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
      console.log('🚀 Starting Google login with system browser...');
      setIsLoading(true);

      // 매번 새로운 OAuth URL 생성 (캐시 방지)
      const { url, redirectUri } = getGoogleAuthUrl();
      console.log('🌐 Opening URL:', url);

      // WebBrowser로 직접 OAuth 실행
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);

      console.log('📱 Browser result:', result);

      if (result.type === 'success' && result.url) {
        await handleAuthCallback(result.url, redirectUri);
      } else if (result.type === 'cancel') {
        console.log('❌ Login cancelled by user');
        setIsLoading(false);
      } else {
        console.log('❌ Login failed:', result);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Failed to start Google login:', error);
      alert('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    console.log('🔵 handleEmailAuth called!');
    console.log('Email raw:', `"${email}"`);
    console.log('Password:', password ? '***' : 'empty');
    console.log('isSignUp:', isSignUp);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        console.log('❌ Email or password missing');
        alert('Please enter both email and password');
        return;
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        alert('Please enter a valid email address');
        return;
      }

      // 회원가입 시 추가 검증
      if (isSignUp) {
        // 비밀번호 길이 검증
        if (trimmedPassword.length < 6) {
          alert('Password must be at least 6 characters long');
          return;
        }

        // 비밀번호 확인 검증
        if (trimmedPassword !== confirmPassword.trim()) {
          alert('Passwords do not match');
          return;
        }
      }

      console.log('Email trimmed:', `"${trimmedEmail}"`);

      setIsLoading(true);
      console.log(`🚀 Starting email ${isSignUp ? 'sign up' : 'login'}...`);

      const result = isSignUp
        ? await signUpWithEmail(trimmedEmail, trimmedPassword)
        : await signInWithEmail(trimmedEmail, trimmedPassword);

      if (result.success) {
        console.log('✅ Email authentication successful!');

        // Update AuthContext with user data
        console.log('🔄 Updating user context...');
        await refreshUser();
        console.log('✅ User context updated!');

        navigation.goBack();
      } else {
        console.error('❌ Email authentication failed:', result.error);
        alert(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('❌ Email authentication error:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Blueming AI</Text>
          <Text style={styles.subtitle}>AI Image Generation Platform</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="images" size={80} color="#3B82F6" />
          </View>
          <Text style={styles.description}>
            Create amazing AI art with{'\n'}
            custom LoRA models
          </Text>

          {/* Login Mode Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, loginMode === 'google' && styles.tabActive]}
              onPress={() => setLoginMode('google')}
            >
              <Text style={[styles.tabText, loginMode === 'google' && styles.tabTextActive]}>
                Google
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, loginMode === 'email' && styles.tabActive]}
              onPress={() => setLoginMode('email')}
            >
              <Text style={[styles.tabText, loginMode === 'email' && styles.tabTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Login Form */}
          {loginMode === 'email' && (
            <View style={styles.emailForm}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#828282"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#828282"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
              {isSignUp && (
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#828282"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
              )}
              <TouchableOpacity
                style={styles.switchModeButton}
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setConfirmPassword('');
                }}
                disabled={isLoading}
              >
                <Text style={styles.switchModeText}>
                  {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {loginMode === 'google' ? (
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
          ) : (
            <TouchableOpacity
              style={[styles.emailButton, isLoading && styles.googleButtonDisabled]}
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.googleButtonText}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <Text style={styles.termsText}>
            By continuing, you agree to our{'\n'}
            Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1D',
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#28282B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BDBDBD',
  },
  tabTextActive: {
    color: '#fff',
  },
  emailForm: {
    width: '100%',
    gap: 16,
  },
  input: {
    backgroundColor: '#28282B',
    borderWidth: 1,
    borderColor: '#4A4A4F',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchModeText: {
    fontSize: 14,
    color: '#3B82F6',
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
  emailButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
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

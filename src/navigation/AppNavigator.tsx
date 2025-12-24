import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ModelDetailScreen from '../screens/ModelDetailScreen';
import ModelCreateScreen from '../screens/ModelCreateScreen';
import TrainingScreen from '../screens/TrainingScreen';
import ProfileScreen from '../screens/ProfileScreen';

import type { RootStackParamList, MainTabParamList, HomeStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

// 홈 스택 네비게이터
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="ModelList"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="ModelDetail"
        component={ModelDetailScreen}
        options={{ title: 'Model Detail' }}
      />
      <HomeStack.Screen
        name="ModelCreate"
        component={ModelCreateScreen}
        options={{ title: 'Create Model' }}
      />
    </HomeStack.Navigator>
  );
}

// 메인 탭 네비게이터
function MainTabNavigator() {
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Training') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Training" component={TrainingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 앱 네비게이터
export default function AppNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null; // 또는 로딩 스크린
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

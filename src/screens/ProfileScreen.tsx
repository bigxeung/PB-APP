import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { modelsAPI, userAPI } from '../services/api';
import { LoraModel } from '../types';
import ModelCard from '../components/ModelCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [myModels, setMyModels] = useState<LoraModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyModels();
  }, []);

  const loadMyModels = async () => {
    try {
      setLoading(true);
      const response = await modelsAPI.getMyModels(0, 20);
      setMyModels(response.content);
    } catch (error) {
      console.error('Failed to load my models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleModelPress = (modelId: number) => {
    // @ts-ignore - 네비게이션 타입 이슈
    navigation.navigate('Main', {
      screen: 'Home',
      params: {
        screen: 'ModelDetail',
        params: { modelId },
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 헤더 */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#BDBDBD" />
        </View>
        <Text style={styles.nickname}>{user?.nickname || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* 통계 */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{myModels.length}</Text>
          <Text style={styles.statLabel}>Models</Text>
        </View>
      </View>

      {/* 내 모델 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Models</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
        ) : myModels.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={60} color="#828282" />
            <Text style={styles.emptyText}>No models yet</Text>
          </View>
        ) : (
          <View style={styles.modelsGrid}>
            {myModels.map((model) => (
              <View key={model.id} style={styles.modelItem}>
                <ModelCard model={model} onPress={() => handleModelPress(model.id)} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1D',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#28282B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#828282',
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 24,
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#828282',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#828282',
  },
  modelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modelItem: {
    width: '48%',
  },
});

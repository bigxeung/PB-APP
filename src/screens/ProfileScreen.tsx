import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { modelsAPI, userAPI, communityAPI, generateAPI, trainingAPI } from '../services/api';
import { LoraModel, GenerationHistoryResponse, TrainingJobResponse } from '../types';
import ModelCard from '../components/ModelCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TabType = 'models' | 'favorites' | 'generation' | 'training';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [activeTab, setActiveTab] = useState<TabType>('models');
  const [myModels, setMyModels] = useState<LoraModel[]>([]);
  const [likedModels, setLikedModels] = useState<LoraModel[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistoryResponse[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingJobResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMyModels(),
        loadLikedModels(),
        loadGenerationHistory(),
        loadTrainingHistory(),
      ]);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyModels = async () => {
    try {
      const response = await modelsAPI.getMyModels(0, 50);
      setMyModels(response.content);
    } catch (error) {
      console.error('Failed to load my models:', error);
    }
  };

  const loadLikedModels = async () => {
    try {
      const response = await communityAPI.getLikedModels(0, 50);
      setLikedModels(response.content);
    } catch (error) {
      console.error('Failed to load liked models:', error);
    }
  };

  const loadGenerationHistory = async () => {
    try {
      const response = await generateAPI.getGenerationHistory(0, 50);
      setGenerationHistory(response.content);
    } catch (error) {
      console.error('Failed to load generation history:', error);
    }
  };

  const loadTrainingHistory = async () => {
    try {
      const response = await trainingAPI.getTrainingHistory();
      setTrainingHistory(response);
    } catch (error) {
      console.error('Failed to load training history:', error);
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

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.notLoggedIn}>
          <Ionicons name="person-circle-outline" size={80} color="#828282" />
          <Text style={styles.notLoggedInTitle}>Login Required</Text>
          <Text style={styles.notLoggedInText}>
            Please login to view your profile and manage your models.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 헤더 */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={40} color={Colors.textMuted} />
          )}
        </View>
        <Text style={styles.nickname}>{user?.nickname || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* 통계 */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{myModels.length}</Text>
          <Text style={styles.statLabel}>Models</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{likedModels.length}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{generationHistory.length}</Text>
          <Text style={styles.statLabel}>Generations</Text>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'models' && styles.tabActive]}
          onPress={() => setActiveTab('models')}
        >
          <Text style={[styles.tabText, activeTab === 'models' && styles.tabTextActive]}>
            My Models
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'generation' && styles.tabActive]}
          onPress={() => setActiveTab('generation')}
        >
          <Text style={[styles.tabText, activeTab === 'generation' && styles.tabTextActive]}>
            Generation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'training' && styles.tabActive]}
          onPress={() => setActiveTab('training')}
        >
          <Text style={[styles.tabText, activeTab === 'training' && styles.tabTextActive]}>
            Training
          </Text>
        </TouchableOpacity>
      </View>

      {/* 탭 컨텐츠 */}
      <View style={styles.tabContent}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            {/* My Models Tab */}
            {activeTab === 'models' && (
              <View style={styles.section}>
                {myModels.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="cube-outline" size={64} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>No models yet</Text>
                    <Text style={styles.emptyHint}>Train your first model to get started</Text>
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
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <View style={styles.section}>
                {likedModels.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={64} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>No favorites yet</Text>
                    <Text style={styles.emptyHint}>Like models to see them here</Text>
                  </View>
                ) : (
                  <View style={styles.modelsGrid}>
                    {likedModels.map((model) => (
                      <View key={model.id} style={styles.modelItem}>
                        <ModelCard model={model} onPress={() => handleModelPress(model.id)} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Generation History Tab */}
            {activeTab === 'generation' && (
              <View style={styles.section}>
                {generationHistory.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={64} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>No generation history</Text>
                    <Text style={styles.emptyHint}>Generate images to see them here</Text>
                  </View>
                ) : (
                  <View style={styles.historyGrid}>
                    {generationHistory.map((history) => (
                      <View key={history.id} style={styles.historyCard}>
                        <View style={styles.historyHeader}>
                          <Text style={styles.historyTitle}>{history.modelTitle}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              history.status === 'SUCCESS' && styles.statusSuccess,
                              history.status === 'GENERATING' && styles.statusGenerating,
                              history.status === 'FAILED' && styles.statusFailed,
                            ]}
                          >
                            <Text style={styles.statusText}>{history.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.historyPrompt} numberOfLines={2}>
                          {history.prompt}
                        </Text>
                        <Text style={styles.historyDate}>
                          {new Date(history.createdAt).toLocaleDateString()}
                        </Text>
                        {history.generatedImages.length > 0 && (
                          <ScrollView horizontal style={styles.historyImages}>
                            {history.generatedImages.map((img) => (
                              <Image
                                key={img.id}
                                source={{ uri: img.s3Url }}
                                style={styles.historyImage}
                              />
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Training History Tab */}
            {activeTab === 'training' && (
              <View style={styles.section}>
                {trainingHistory.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="construct-outline" size={64} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>No training history</Text>
                    <Text style={styles.emptyHint}>Train models to see them here</Text>
                  </View>
                ) : (
                  <View style={styles.historyGrid}>
                    {trainingHistory.map((job) => (
                      <View key={job.id} style={styles.historyCard}>
                        <View style={styles.historyHeader}>
                          <Text style={styles.historyTitle}>{job.modelName}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              job.status === 'COMPLETED' && styles.statusSuccess,
                              job.status === 'TRAINING' && styles.statusGenerating,
                              job.status === 'FAILED' && styles.statusFailed,
                            ]}
                          >
                            <Text style={styles.statusText}>{job.status}</Text>
                          </View>
                        </View>
                        {job.modelDescription && (
                          <Text style={styles.historyPrompt} numberOfLines={2}>
                            {job.modelDescription}
                          </Text>
                        )}
                        <View style={styles.trainingStats}>
                          <Text style={styles.trainingStat}>
                            Epochs: {job.currentEpoch}/{job.totalEpochs}
                          </Text>
                          <Text style={styles.trainingStat}>
                            Images: {job.trainingImagesCount}
                          </Text>
                        </View>
                        <Text style={styles.historyDate}>
                          {new Date(job.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  nickname: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.error,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  emptyHint: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  modelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  modelItem: {
    width: '48%',
  },
  historyGrid: {
    gap: Spacing.md,
  },
  historyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginLeft: Spacing.sm,
  },
  statusSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusGenerating: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  statusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  historyPrompt: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  historyDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  historyImages: {
    marginTop: Spacing.md,
  },
  historyImage: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    marginRight: Spacing.sm,
    backgroundColor: Colors.bgHover,
  },
  trainingStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  trainingStat: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  notLoggedIn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  notLoggedInTitle: {
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  notLoggedInText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl * 2,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl * 2,
    borderRadius: Radius.lg,
    ...Shadows.glow,
  },
  loginButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
});

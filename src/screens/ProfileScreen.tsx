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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TopNavigation from '../components/TopNavigation';
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
  const { user, logout, isAuthenticated, testLogin } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [activeTab, setActiveTab] = useState<TabType>('models');
  const [myModels, setMyModels] = useState<LoraModel[]>([]);
  const [likedModels, setLikedModels] = useState<LoraModel[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistoryResponse[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [testLoginLoading, setTestLoginLoading] = useState(false);

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
      setMyModels(response.content || []);
    } catch (error) {
      console.error('Failed to load my models:', error);
      setMyModels([]);
    }
  };

  const loadLikedModels = async () => {
    try {
      const response = await communityAPI.getLikedModels(0, 50);
      setLikedModels(response.content || []);
    } catch (error) {
      console.error('Failed to load liked models:', error);
      setLikedModels([]);
    }
  };

  const loadGenerationHistory = async () => {
    try {
      const response = await generateAPI.getGenerationHistory(0, 50);
      setGenerationHistory(response.content || []);
    } catch (error) {
      console.error('Failed to load generation history:', error);
      setGenerationHistory([]);
    }
  };

  const loadTrainingHistory = async () => {
    try {
      const response = await trainingAPI.getTrainingHistory();
      setTrainingHistory(response || []);
    } catch (error) {
      console.error('Failed to load training history:', error);
      setTrainingHistory([]);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleModelPress = (modelId: number) => {
    // @ts-ignore - Navigate directly to ModelDetail
    navigation.navigate('ModelDetail', { modelId });
  };

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  const handleTestLogin = async () => {
    try {
      setTestLoginLoading(true);
      await testLogin();
    } catch (error) {
      console.error('Test login failed:', error);
    } finally {
      setTestLoginLoading(false);
    }
  };

  const { isDark } = useTheme();
  const bgColor = isDark ? Colors.bgDark : '#FFFFFF';
  const textColor = isDark ? Colors.textPrimary : '#000';
  const secondaryTextColor = isDark ? Colors.textSecondary : '#666';
  const mutedTextColor = isDark ? Colors.textMuted : '#999';
  const cardBgColor = isDark ? Colors.bgCard : '#F5F5F5';
  const borderColor = isDark ? Colors.border : '#E0E0E0';

  const renderListHeader = () => (
    <>
      {/* 프로필 헤더 */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={[styles.avatar, { backgroundColor: cardBgColor }]}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={40} color={mutedTextColor} />
          )}
        </View>
        <Text style={[styles.nickname, { color: textColor }]}>{user?.nickname || 'User'}</Text>
        <Text style={[styles.email, { color: secondaryTextColor }]}>{user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={[styles.logoutText, { color: Colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* 통계 */}
      {!loading && (
        <View style={[styles.stats, { borderBottomColor: borderColor }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textColor }]}>{myModels?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Models</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textColor }]}>{likedModels?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Favorites</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textColor }]}>{generationHistory?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Generations</Text>
          </View>
        </View>
      )}

      {/* 탭 */}
      <View style={[styles.tabsContainer, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'models' && styles.tabActive]}
          onPress={() => setActiveTab('models')}
        >
          <Text style={[styles.tabText, { color: secondaryTextColor }, activeTab === 'models' && styles.tabTextActive]}>
            My Models
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, { color: secondaryTextColor }, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'generation' && styles.tabActive]}
          onPress={() => setActiveTab('generation')}
        >
          <Text style={[styles.tabText, { color: secondaryTextColor }, activeTab === 'generation' && styles.tabTextActive]}>
            Generation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'training' && styles.tabActive]}
          onPress={() => setActiveTab('training')}
        >
          <Text style={[styles.tabText, { color: secondaryTextColor }, activeTab === 'training' && styles.tabTextActive]}>
            Training
          </Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />}
    </>
  );

  const renderEmptyComponent = () => {
    if (loading) return null;
    
    switch (activeTab) {
      case 'models':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={mutedTextColor} />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No models yet</Text>
            <Text style={[styles.emptyHint, { color: mutedTextColor }]}>Train your first model to get started</Text>
          </View>
        );
      case 'favorites':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={mutedTextColor} />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No favorites yet</Text>
            <Text style={[styles.emptyHint, { color: mutedTextColor }]}>Like models to see them here</Text>
          </View>
        );
      case 'generation':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={mutedTextColor} />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No generation history</Text>
            <Text style={[styles.emptyHint, { color: mutedTextColor }]}>Generate images to see them here</Text>
          </View>
        );
      case 'training':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={64} color={mutedTextColor} />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No training history</Text>
            <Text style={[styles.emptyHint, { color: mutedTextColor }]}>Train models to see them here</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    switch (activeTab) {
      case 'models':
      case 'favorites':
        return (
          <View style={styles.modelItem}>
            <ModelCard model={item} onPress={() => handleModelPress(item.id)} />
          </View>
        );
      case 'generation':
        return (
          <TouchableOpacity
            style={[styles.generationCard, { backgroundColor: cardBgColor, borderColor }]}
            activeOpacity={0.7}
          >
            {item.generatedImages.length > 0 && (
              <View style={styles.generationThumbnail}>
                <Image
                  source={{ uri: item.generatedImages[0].s3Url }}
                  style={styles.generationImage}
                  resizeMode="cover"
                />
                {item.generatedImages.length > 1 && (
                  <View style={styles.imageCountBadge}>
                    <Ionicons name="images" size={12} color="#fff" />
                    <Text style={styles.imageCountText}>{item.generatedImages.length}</Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.generationInfo}>
              <Text style={[styles.generationModelTitle, { color: textColor }]} numberOfLines={1}>
                {item.modelTitle}
              </Text>
              <Text style={[styles.generationPrompt, { color: secondaryTextColor }]} numberOfLines={2}>
                {item.prompt}
              </Text>
              <View style={styles.generationFooter}>
                <Text style={[styles.generationDate, { color: mutedTextColor }]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.generationStatusBadge,
                    item.status === 'SUCCESS' && styles.statusSuccess,
                    item.status === 'GENERATING' && styles.statusGenerating,
                    item.status === 'FAILED' && styles.statusFailed,
                  ]}
                >
                  <Text style={styles.generationStatusText}>{item.status}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      case 'training':
        return (
          <View style={[styles.historyCard, { backgroundColor: cardBgColor, borderColor }]}>
            <View style={styles.trainingCardContent}>
              <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: textColor }]}>{item.modelName}</Text>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'COMPLETED' && styles.statusSuccess,
                  item.status === 'TRAINING' && styles.statusGenerating,
                  item.status === 'FAILED' && styles.statusFailed,
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            {item.modelDescription && (
              <Text style={[styles.historyPrompt, { color: secondaryTextColor }]} numberOfLines={2}>
                {item.modelDescription}
              </Text>
            )}
            <View style={styles.trainingStats}>
              <Text style={[styles.trainingStat, { color: secondaryTextColor }]}>
                Epochs: {item.currentEpoch}/{item.totalEpochs}
              </Text>
              <Text style={[styles.trainingStat, { color: secondaryTextColor }]}>
                Images: {item.trainingImagesCount}
              </Text>
            </View>
            <Text style={[styles.historyDate, { color: mutedTextColor }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };
  
  const dataForTab = {
    models: myModels,
    favorites: likedModels,
    generation: generationHistory,
    training: trainingHistory,
  };

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <TopNavigation showSearch={false} showProfile={false} />
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <View style={styles.notLoggedIn}>
            <Ionicons name="person-circle-outline" size={80} color="#828282" />
            <Text style={[styles.notLoggedInTitle, { color: textColor }]}>Login Required</Text>
            <Text style={[styles.notLoggedInText, { color: secondaryTextColor }]}>
              Please login to view your profile and manage your models.
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testLoginButton}
              onPress={handleTestLogin}
              disabled={testLoginLoading}
            >
              {testLoginLoading ? (
                <ActivityIndicator size="small" color={Colors.textSecondary} />
              ) : (
                <>
                  <Ionicons name="flask-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.testLoginButtonText}>Test Account Login</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <TopNavigation showSearch={false} showProfile={false} />
      <FlatList
        data={loading ? [] : dataForTab[activeTab]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={activeTab === 'models' || activeTab === 'favorites' ? 2 : 1}
        key={activeTab === 'models' || activeTab === 'favorites' ? 'two-columns' : 'one-column'}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={activeTab === 'models' || activeTab === 'favorites' ? styles.modelRow : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Spacing.lg,
  },
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: FontSizes.sm,
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
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
  },
  statValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
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
  },
  emptyHint: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
  },
  modelList: {},
  modelRow: {
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  modelItem: {
    width: '48%',
  },
  historyGrid: {
    gap: Spacing.md,
  },
  historyCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
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
    marginBottom: Spacing.sm,
  },
  historyDate: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.sm,
  },
  generationImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  generationMainImage: {
    width: '100%',
    height: '100%',
  },
  imageCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  imageCountText: {
    fontSize: FontSizes.xs,
    color: '#fff',
    fontWeight: '600',
  },
  generationCardContent: {
    padding: Spacing.lg,
  },
  trainingCardContent: {
    padding: Spacing.lg,
  },
  historyImages: {
    marginTop: Spacing.md,
  },
  historyImage: {
    width: 100,
    height: 100,
    borderRadius: Radius.md,
    marginRight: Spacing.sm,
  },
  trainingStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  trainingStat: {
    fontSize: FontSizes.sm,
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
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  notLoggedInText: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    marginBottom: Spacing.xl * 2,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    ...Shadows.glow,
  },
  loginButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  testLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  testLoginButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  generationCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 12,
  },
  generationThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  generationImage: {
    width: '100%',
    height: '100%',
  },
  generationInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  generationModelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  generationPrompt: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  generationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generationDate: {
    fontSize: 12,
  },
  generationStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  generationStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
});

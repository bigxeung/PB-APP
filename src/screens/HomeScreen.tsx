import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { modelsAPI } from '../services/api';
import { LoraModel, HomeStackParamList } from '../types';
import ModelCard from '../components/ModelCard';
import ModelCardSkeleton from '../components/ModelCardSkeleton';
import GenerateModal from '../components/generate/GenerateModal';
import { useAuth } from '../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ModelList'>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuth();
  const [models, setModels] = useState<LoraModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState<'popular' | 'recent'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroAnimation = useRef(new Animated.Value(0)).current;
  const fabAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    loadModels(true);
  }, [tab]);

  useEffect(() => {
    // Hero and FAB animations
    Animated.parallel([
      Animated.timing(heroAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(fabAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadModels = async (refresh = false) => {
    if (loading || (!hasMore && !refresh)) {
      console.log('⏭️ Skipping loadModels:', { loading, hasMore, refresh });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const currentPage = refresh ? 0 : page;

      const response = tab === 'popular'
        ? await modelsAPI.getPopularModels(currentPage, 20)
        : await modelsAPI.getPublicModels(currentPage, 20);

      if (refresh) {
        setModels(response.content);
      } else {
        setModels(prev => [...prev, ...response.content]);
      }

      setPage(currentPage + 1);
      setHasMore(currentPage < response.totalPages - 1);
    } catch (error: any) {
      console.error('❌ Failed to load models:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url,
      });

      const errorMessage = error.response?.data?.message
        || error.message
        || 'Failed to load models';

      setError(errorMessage);

      Alert.alert(
        'API Error',
        `${errorMessage}\n\nStatus: ${error.response?.status || 'N/A'}\nURL: ${error.config?.baseURL || 'N/A'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    loadModels(true);
  };

  const handleModelPress = (modelId: number) => {
    navigation.navigate('ModelDetail', { modelId });
  };

  const handleCreatePress = () => {
    setShowGenerateModal(true);
  };

  const handleCloseGenerateModal = () => {
    setShowGenerateModal(false);
  };

  const handleSearch = () => {
    setPage(0);
    loadModels(true);
  };

  const renderHeroSection = () => (
    <Animated.View
      style={[
        styles.heroSection,
        {
          opacity: heroAnimation,
          transform: [
            {
              translateY: heroAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.animationContainer}>
        <View style={styles.shape1} />
        <View style={styles.shape2} />
        <View style={styles.shape3} />
      </View>

      <Text style={styles.heroTitle}>Where AI Blossoms</Text>
      <Text style={styles.heroSubtitle}>
        Blueming AI is where your ideas come to life.{'\n'}
        Explore, create, and share with a global community.
      </Text>

      <TouchableOpacity
        style={styles.heroCTA}
        onPress={handleCreatePress}
      >
        <Text style={styles.heroCTAText}>Start Creating</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#828282" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search models..."
          placeholderTextColor="#828282"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#828282" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'popular' && styles.tabActive]}
          onPress={() => setTab('popular')}
        >
          <Text style={[styles.tabText, tab === 'popular' && styles.tabTextActive]}>
            Popular
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'recent' && styles.tabActive]}
          onPress={() => setTab('recent')}
        >
          <Text style={[styles.tabText, tab === 'recent' && styles.tabTextActive]}>
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreatePress}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  if (initialLoading) {
    return (
      <ScrollView style={styles.container}>
        {renderHeroSection()}
        {renderSearchBar()}
        {renderTabs()}
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonRow}>
            <ModelCardSkeleton />
            <ModelCardSkeleton />
          </View>
          <View style={styles.skeletonRow}>
            <ModelCardSkeleton />
            <ModelCardSkeleton />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={models}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ModelCard model={item} onPress={() => handleModelPress(item.id)} />
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <>
            {renderHeroSection()}
            {renderSearchBar()}
            {renderTabs()}
          </>
        )}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            {error ? (
              <>
                <Ionicons name="alert-circle" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
                <Text style={styles.errorText}>Error Loading Models</Text>
                <Text style={styles.errorDetails}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setPage(0);
                    loadModels(true);
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyText}>No models found</Text>
            )}
          </View>
        )}
        onEndReached={() => loadModels()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      />

      <Animated.View
        style={[
          styles.fab,
          {
            transform: [
              { scale: fabAnimation },
              {
                translateY: fabAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
            opacity: fabAnimation,
          },
        ]}
      >
        <TouchableOpacity style={styles.fabButton} onPress={handleCreatePress}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <GenerateModal
        visible={showGenerateModal}
        onClose={handleCloseGenerateModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1D',
  },
  heroSection: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1A1A1D',
  },
  animationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shape1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 71, 171, 0.15)',
    top: -50,
    left: -50,
  },
  shape2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 207, 255, 0.1)',
    bottom: -30,
    right: -30,
  },
  shape3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    bottom: 40,
    left: '15%',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  heroCTA: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  heroCTAText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: -30,
    marginBottom: 20,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 43, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#828282',
  },
  tabTextActive: {
    color: '#fff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    marginLeft: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#828282',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetails: {
    color: '#828282',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { modelsAPI, tagsAPI } from '../services/api';
import { LoraModel, HomeStackParamList, TagResponse } from '../types';
import ModelCard from '../components/ModelCard';
import ModelCardSkeleton from '../components/ModelCardSkeleton';
import GenerateModal from '../components/generate/GenerateModal';
import TopNavigation from '../components/TopNavigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ModelList'>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [tags, setTags] = useState<TagResponse[]>([]);

  const heroAnimation = useRef(new Animated.Value(0)).current;
  const fabAnimation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    loadModels(true);
  }, [tab, selectedTags]);

  useEffect(() => {
    loadTags();
  }, []);

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

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getPopularTags();
      setTags(response);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadModels = async (refresh = false) => {
    if (loading || (!hasMore && !refresh)) {
      console.log('⏭️ Skipping loadModels:', { loading, hasMore, refresh });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const currentPage = refresh ? 0 : page;

      let response;

      // 태그가 선택된 경우 필터 API 사용 (popular/recent 정렬 함께 적용)
      if (selectedTags.length > 0) {
        response = await modelsAPI.filterByTags(selectedTags, currentPage, 20, tab);
      } else {
        // 태그가 없는 경우 기존 로직 (popular/recent에 따라)
        response = tab === 'popular'
          ? await modelsAPI.getPopularModels(currentPage, 20)
          : await modelsAPI.getPublicModels(currentPage, 20);
      }

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

  const handleSearchPress = () => {
    if (!showSearch) {
      setShowSearch(true);
      // 검색바가 렌더링될 때까지 약간 대기 후 스크롤
      setTimeout(() => {
        const scrollOffset = 280; // HeroSection의 대략적인 높이
        if (flatListRef.current) {
          // FlatList인 경우
          if ('scrollToOffset' in flatListRef.current) {
            flatListRef.current.scrollToOffset({
              offset: scrollOffset,
              animated: true,
            });
          }
          // ScrollView인 경우
          else if ('scrollTo' in flatListRef.current) {
            flatListRef.current.scrollTo({
              y: scrollOffset,
              animated: true,
            });
          }
        }
      }, 100);
    } else {
      setShowSearch(false);
    }
  };

  const handleTagSelect = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        // 이미 선택된 태그면 제거
        return prev.filter(t => t !== tagName);
      } else {
        // 새로운 태그 추가
        return [...prev, tagName];
      }
    });
  };

  const renderHeroSection = () => (
    <Animated.View
      style={[
        styles.heroSection,
        { backgroundColor: bgColor },
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

      <Text style={[styles.heroTitle, { color: textColor }]}>Where AI Blossoms</Text>
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
      <View style={[styles.searchContainer, {
        backgroundColor: isDark ? 'rgba(40, 40, 43, 0.8)' : 'rgba(240, 240, 240, 1)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }]}>
        <Ionicons name="search" size={20} color="#828282" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
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
          <Text style={[
            styles.tabText,
            !isDark && tab !== 'popular' && { color: '#666' },
            tab === 'popular' && styles.tabTextActive
          ]}>
            Popular
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'recent' && styles.tabActive]}
          onPress={() => setTab('recent')}
        >
          <Text style={[
            styles.tabText,
            !isDark && tab !== 'recent' && { color: '#666' },
            tab === 'recent' && styles.tabTextActive
          ]}>
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

  const renderTagFilter = () => {
    return (
      <View style={[styles.tagFilterContainer, { backgroundColor: bgColor }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagFilterContent}
        >
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.name);
            return (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  },
                  isSelected && styles.tagChipActive,
                ]}
                onPress={() => handleTagSelect(tag.name)}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    !isDark && !isSelected && { color: '#666' },
                    isSelected && styles.tagChipTextActive,
                  ]}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  const bgColor = isDark ? '#1A1A1D' : '#FFFFFF';
  const textColor = isDark ? '#fff' : '#000';

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <TopNavigation onSearchPress={handleSearchPress} />
        <ScrollView
          ref={flatListRef}
          style={[styles.container, { backgroundColor: bgColor }]}
        >
          {renderHeroSection()}
          {showSearch && renderSearchBar()}
          {renderTabs()}
          {renderTagFilter()}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <TopNavigation onSearchPress={handleSearchPress} />
      <FlatList
        ref={flatListRef}
        style={[styles.container, { backgroundColor: bgColor }]}
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
            {showSearch && renderSearchBar()}
            {renderTabs()}
            {renderTagFilter()}
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
  heroSection: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
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
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
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
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  row: {
    gap: 16,
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
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
  tagFilterContainer: {
    paddingVertical: 12,
  },
  tagFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tagChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#828282',
  },
  tagChipTextActive: {
    color: '#fff',
  },
});

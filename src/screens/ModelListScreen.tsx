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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { modelsAPI } from '../services/api';
import { LoraModel, HomeStackParamList } from '../types';
import ModelCard from '../components/ModelCard';
import ModelCardSkeleton from '../components/ModelCardSkeleton';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ModelList'>;

export default function ModelListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [models, setModels] = useState<LoraModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState<'popular' | 'recent'>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const fabAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadModels(true);
  }, [tab]);

  useEffect(() => {
    // FAB 진입 애니메이션
    Animated.spring(fabAnimation, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadModels = async (refresh = false) => {
    if (loading || (!hasMore && !refresh)) return;

    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Failed to load models:', error);
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#828282" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search models..."
          placeholderTextColor="#828282"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => loadModels(true)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#828282" />
          </TouchableOpacity>
        )}
      </View>
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
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonRow}>
            <ModelCardSkeleton />
            <ModelCardSkeleton />
          </View>
          <View style={styles.skeletonRow}>
            <ModelCardSkeleton />
            <ModelCardSkeleton />
          </View>
          <View style={styles.skeletonRow}>
            <ModelCardSkeleton />
            <ModelCardSkeleton />
          </View>
        </View>
      </View>
    );
  }

  const handleCreatePress = () => {
    navigation.navigate('ModelCreate');
  };

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
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1D',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28282B',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#828282',
  },
  tabTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  row: {
    gap: 12,
    marginBottom: 12,
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
    gap: 12,
    marginBottom: 12,
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

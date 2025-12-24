import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { modelsAPI } from '../services/api';
import { ModelDetailResponse, HomeStackParamList } from '../types';

type ModelDetailRouteProp = RouteProp<HomeStackParamList, 'ModelDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ModelDetailScreen() {
  const route = useRoute<ModelDetailRouteProp>();
  const navigation = useNavigation();
  const { modelId } = route.params;

  const [model, setModel] = useState<ModelDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadModelDetail();
  }, [modelId]);

  const loadModelDetail = async () => {
    try {
      setLoading(true);
      const data = await modelsAPI.getModelDetail(modelId);
      setModel(data);
    } catch (error) {
      console.error('Failed to load model detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await modelsAPI.toggleLike(modelId);
      await loadModelDetail(); // 새로고침
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  if (loading || !model) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const renderImageItem = ({ item }: { item: { id: number; imageUrl: string } }) => (
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.mainImage}
      resizeMode="cover"
    />
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  return (
    <ScrollView style={styles.container}>
      {/* 이미지 갤러리 */}
      {model.samples.length > 0 && (
        <View style={styles.imageGallery}>
          <FlatList
            data={model.samples}
            renderItem={renderImageItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          />
          {model.samples.length > 1 && (
            <View style={styles.pagination}>
              {model.samples.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* 정보 섹션 */}
      <View style={styles.content}>
        {/* 제목 & 좋아요 */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{model.title}</Text>
            <Text style={styles.author}>by {model.userNickname || 'Anonymous'}</Text>
          </View>
          <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
            <Ionicons
              name={model.isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={model.isLiked ? '#EF4444' : '#BDBDBD'}
            />
            <Text style={styles.likeCount}>{model.likeCount}</Text>
          </TouchableOpacity>
        </View>

        {/* 설명 */}
        {model.description && (
          <View style={styles.section}>
            <Text style={styles.description}>{model.description}</Text>
          </View>
        )}

        {/* 프롬프트 */}
        {model.prompts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prompts</Text>
            {model.prompts.map((prompt) => (
              <View key={prompt.id} style={styles.promptCard}>
                {prompt.title && (
                  <Text style={styles.promptTitle}>{prompt.title}</Text>
                )}
                <Text style={styles.promptText}>{prompt.promptText}</Text>
                {prompt.negativePrompt && (
                  <Text style={styles.negativePrompt}>
                    Negative: {prompt.negativePrompt}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 태그 */}
        {model.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tags}>
              {model.tags.map((tag) => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
            </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGallery: {
    width: SCREEN_WIDTH,
    aspectRatio: 3 / 4,
    backgroundColor: '#28282B',
    position: 'relative',
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#828282',
  },
  likeButton: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#28282B',
    borderRadius: 8,
    minWidth: 60,
  },
  likeCount: {
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#BDBDBD',
    lineHeight: 20,
  },
  promptCard: {
    backgroundColor: '#28282B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 13,
    color: '#BDBDBD',
    lineHeight: 18,
    marginBottom: 4,
  },
  negativePrompt: {
    fontSize: 12,
    color: '#828282',
    lineHeight: 16,
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#28282B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#BDBDBD',
  },
});

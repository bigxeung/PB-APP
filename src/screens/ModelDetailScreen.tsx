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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { modelsAPI, communityAPI } from '../services/api';
import { ModelDetailResponse, HomeStackParamList, CommentResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import GenerateModal from '../components/generate/GenerateModal';

type ModelDetailRouteProp = RouteProp<HomeStackParamList, 'ModelDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ModelDetailScreen() {
  const route = useRoute<ModelDetailRouteProp>();
  const navigation = useNavigation();
  const { modelId } = route.params;
  const { isAuthenticated, user } = useAuth();

  const [model, setModel] = useState<ModelDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // useRef는 조건부 return 이전에 선언되어야 함
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  useEffect(() => {
    loadModelDetail();
    loadComments();
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

  const loadComments = async () => {
    try {
      const response = await communityAPI.getComments(modelId, 0, 50);
      console.log('📝 Comments API response:', response);
      console.log('📝 Comments content:', response?.content);
      setComments(response.content);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to like models');
      return;
    }
    try {
      await modelsAPI.toggleLike(modelId);
      await loadModelDetail();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const response = await communityAPI.createComment(modelId, newComment.trim());
      setComments([response, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    }
  };

  const handleToggleCommentLike = async (commentId: number) => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to like comments');
      return;
    }
    try {
      await communityAPI.toggleCommentLike(modelId, commentId);
      await loadComments();
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityAPI.deleteComment(modelId, commentId);
              setComments(comments.filter(c => c.id !== commentId));
            } catch (error) {
              console.error('Failed to delete comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const renderImageItem = ({ item }: { item: { id: number; imageUrl: string } }) => (
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.mainImage}
      resizeMode="cover"
    />
  );

  if (loading || !model) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 샘플 이미지 갤러리 */}
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

        {/* 모델 정보 */}
        <View style={styles.content}>
          {/* 제목 */}
          <Text style={styles.title}>{model.title}</Text>

          {/* 설명 */}
          {model.description && (
            <Text style={styles.description}>{model.description}</Text>
          )}

          {/* 작성자 */}
          <View style={styles.authorRow}>
            <Text style={styles.author}>by {model.userNickname || 'Anonymous'}</Text>
          </View>

          {/* 태그 */}
          {model.tags.length > 0 && (
            <View style={styles.tags}>
              {model.tags.map((tag) => (
                <View key={tag.id} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 액션 버튼 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.likeButton, model.isLiked && styles.likeButtonActive]}
              onPress={handleLike}
            >
              <Ionicons
                name={model.isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={model.isLiked ? '#EF4444' : '#fff'}
              />
              <Text style={[styles.buttonText, model.isLiked && styles.likeButtonTextActive]}>
                {model.likeCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => setShowGenerateModal(true)}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.buttonText}>Generate with this model</Text>
            </TouchableOpacity>
          </View>

          {/* 프롬프트 예시 */}
          {model.prompts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prompt Examples</Text>
              {model.prompts.map((prompt) => (
                <View key={prompt.id} style={styles.promptCard}>
                  {prompt.title && (
                    <Text style={styles.promptTitle}>{prompt.title}</Text>
                  )}
                  <View style={styles.promptBox}>
                    <Text style={styles.promptLabel}>Positive Prompt</Text>
                    <Text style={styles.promptText}>{prompt.promptText}</Text>
                  </View>
                  {prompt.negativePrompt && (
                    <View style={styles.promptBox}>
                      <Text style={styles.promptLabel}>Negative Prompt</Text>
                      <Text style={styles.promptText}>{prompt.negativePrompt}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* 댓글 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>

            {/* 댓글 작성 */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#828282"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.commentSubmitButton}
                onPress={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                <Text style={styles.commentSubmitText}>Post</Text>
              </TouchableOpacity>
            </View>

            {/* 댓글 리스트 */}
            <View style={styles.commentsList}>
              {!comments || comments.length === 0 ? (
                <View style={styles.emptyComments}>
                  <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthor}>
                        <Text style={styles.commentAuthorName}>{comment.userNickname}</Text>
                        <Text style={styles.commentDate}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {user && comment.userId === user.id && (
                        <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    <TouchableOpacity
                      style={styles.commentLikeButton}
                      onPress={() => handleToggleCommentLike(comment.id)}
                    >
                      <Ionicons
                        name={comment.isLiked ? 'heart' : 'heart-outline'}
                        size={16}
                        color={comment.isLiked ? '#EF4444' : '#828282'}
                      />
                      <Text style={styles.commentLikeText}>{comment.likeCount}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <GenerateModal
        visible={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        initialModelId={modelId}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1D',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGallery: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#BDBDBD',
    lineHeight: 24,
    marginBottom: 16,
  },
  authorRow: {
    marginBottom: 16,
  },
  author: {
    fontSize: 14,
    fontWeight: '600',
    color: '#828282',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28282B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  likeButtonActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  likeButtonTextActive: {
    color: '#EF4444',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  promptCard: {
    backgroundColor: '#28282B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  promptBox: {
    marginBottom: 12,
  },
  promptLabel: {
    fontSize: 12,
    color: '#828282',
    marginBottom: 6,
  },
  promptText: {
    fontSize: 14,
    color: '#BDBDBD',
    lineHeight: 20,
  },
  commentInputContainer: {
    marginBottom: 20,
  },
  commentInput: {
    backgroundColor: '#28282B',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  commentSubmitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  commentSubmitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentsList: {
    gap: 12,
  },
  emptyComments: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCommentsText: {
    color: '#828282',
    fontSize: 14,
  },
  commentCard: {
    backgroundColor: '#28282B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  commentDate: {
    fontSize: 12,
    color: '#828282',
  },
  commentContent: {
    fontSize: 14,
    color: '#BDBDBD',
    lineHeight: 20,
    marginBottom: 12,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  commentLikeText: {
    fontSize: 12,
    color: '#828282',
  },
});

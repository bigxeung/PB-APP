import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/theme';
import { modelsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ModelDetailResponse } from '../types';
import GenerateModal from './generate/GenerateModal';

interface ModelDetailModalProps {
  visible: boolean;
  onClose: () => void;
  modelId: number | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ModelDetailModal({
  visible,
  onClose,
  modelId,
}: ModelDetailModalProps) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<ModelDetailResponse | null>(null);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  useEffect(() => {
    if (visible && modelId) {
      loadModelDetail();
    }
  }, [visible, modelId]);

  const loadModelDetail = async () => {
    if (!modelId) return;

    try {
      setLoading(true);
      setError('');
      const data = await modelsAPI.getModelDetail(modelId);
      setModel(data);
      setCurrentImageIndex(0);
    } catch (err: any) {
      setError(err.message || 'Failed to load model details');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to like models');
      return;
    }
    if (!modelId) return;

    try {
      await modelsAPI.toggleLike(modelId);
      await loadModelDetail();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleGenerate = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to generate images');
      return;
    }
    setShowGenerateModal(true);
  };

  const renderImageItem = ({ item }: { item: { id: number; imageUrl: string } }) => (
    <View style={styles.imageItemContainer}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.mainImage}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Model Details</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : model ? (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Sample Images Gallery */}
              {model.samples.length > 0 && (
                <View style={styles.imageGallery}>
                  <FlatList
                    data={model.samples}
                    renderItem={renderImageItem}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={SCREEN_WIDTH * 0.85 + Spacing.md}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    contentContainerStyle={styles.imageListContainer}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                  />
                  {model.samples.length > 1 && (
                    <View style={styles.pagination}>
                      <Text style={styles.imageCounter}>
                        {currentImageIndex + 1} / {model.samples.length}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Model Info */}
              <View style={styles.content}>
                {/* Title */}
                <Text style={styles.title}>{model.title}</Text>

                {/* Description */}
                {model.description && (
                  <Text style={styles.description}>{model.description}</Text>
                )}

                {/* Author Info */}
                <View style={styles.authorSection}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color={Colors.textPrimary} />
                  </View>
                  <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{model.authorName || 'Anonymous'}</Text>
                    <Text style={styles.authorDate}>
                      {new Date(model.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="heart" size={16} color={Colors.error} />
                    <Text style={styles.statText}>{model.likesCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="eye" size={16} color={Colors.primary} />
                    <Text style={styles.statText}>{model.viewCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={16} color={Colors.warning} />
                    <Text style={styles.statText}>{model.favoritesCount}</Text>
                  </View>
                </View>

                {/* Tags */}
                {model.tags && model.tags.length > 0 && (
                  <View style={styles.tagsSection}>
                    <Text style={styles.sectionTitle}>Tags</Text>
                    <View style={styles.tagsContainer}>
                      {model.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Prompts */}
                {model.prompts && model.prompts.length > 0 && (
                  <View style={styles.promptsSection}>
                    <Text style={styles.sectionTitle}>Example Prompts</Text>
                    {model.prompts.map((prompt) => (
                      <View key={prompt.id} style={styles.promptCard}>
                        <Text style={styles.promptText}>{prompt.promptText}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    model.status === 'COMPLETED' && styles.statusSuccess,
                    model.status === 'TRAINING' && styles.statusGenerating,
                    model.status === 'FAILED' && styles.statusFailed,
                  ]}
                >
                  <Text style={styles.statusText}>{model.status}</Text>
                </View>
              </View>
            </ScrollView>
          ) : null}

          {/* Action Buttons */}
          {model && (
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={[styles.actionButton, styles.likeButton]}
                onPress={handleLike}
              >
                <Ionicons
                  name={model.isLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={model.isLiked ? Colors.error : Colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.generateButton]}
                onPress={handleGenerate}
                disabled={model.status !== 'COMPLETED'}
              >
                <Text style={styles.generateButtonText}>Generate</Text>
                <Ionicons name="sparkles" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Generate Modal */}
      {showGenerateModal && model && (
        <GenerateModal
          visible={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          initialModelId={model.id}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.xl + 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl * 2,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.error,
    textAlign: 'center',
  },
  imageGallery: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    position: 'relative',
    marginBottom: Spacing.md,
  },
  imageListContainer: {
    paddingHorizontal: Spacing.lg,
  },
  imageItemContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    marginRight: Spacing.md,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
  },
  pagination: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  authorDate: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tagsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  promptsSection: {
    marginBottom: Spacing.lg,
  },
  promptCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  promptText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  statusSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusGenerating: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  statusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  actionBar: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  likeButton: {
    width: 56,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  generateButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    ...Shadows.glow,
  },
  generateButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: '#fff',
  },
});

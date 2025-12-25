import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../../constants/theme';
import { generateAPI } from '../../services/api';
import type { GenerationHistoryResponse } from '../../types';

interface GenerationHistoryDetailModalProps {
  visible: boolean;
  onClose: () => void;
  historyId: number | null;
  onDeleted?: (id: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GenerationHistoryDetailModal({
  visible,
  onClose,
  historyId,
  onDeleted,
}: GenerationHistoryDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<GenerationHistoryResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && historyId) {
      loadHistoryDetails();
    }
  }, [visible, historyId]);

  const loadHistoryDetails = async () => {
    if (!historyId) return;

    try {
      setLoading(true);
      setError('');
      const detail = await generateAPI.getHistoryDetail(historyId);
      setHistory(detail);
    } catch (err: any) {
      setError(err.message || 'Failed to load history details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!historyId) return;

    Alert.alert(
      'Delete Generation',
      'Are you sure you want to delete this generation record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await generateAPI.deleteHistory(historyId);
              onDeleted?.(historyId);
              onClose();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete history');
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = async (text: string, type: 'prompt' | 'negative') => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', `${type === 'prompt' ? 'Prompt' : 'Negative prompt'} copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const downloadImage = async (url: string, index: number) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library access to download images');
        return;
      }

      const filename = `blueming_ai_history_${historyId}_${index + 1}.png`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.uri) {
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
        Alert.alert('Success', 'Image saved to gallery');
      }
    } catch (error) {
      console.error('Failed to download image:', error);
      Alert.alert('Error', 'Failed to download image');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Generation Details</Text>
            <View style={styles.headerActions}>
              {history && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
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
          ) : history ? (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Status Badge */}
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

              {/* Model Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Model</Text>
                <Text style={styles.modelTitle}>{history.modelTitle}</Text>
                <Text style={styles.date}>
                  {new Date(history.createdAt).toLocaleString()}
                </Text>
              </View>

              {/* Generated Images */}
              {history.generatedImages && history.generatedImages.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      Generated Images ({history.generatedImages.length})
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {history.generatedImages.map((image, index) => (
                      <View key={image.id} style={styles.imageCard}>
                        <Image source={{ uri: image.s3Url }} style={styles.image} resizeMode="cover" />
                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={() => downloadImage(image.s3Url, index)}
                        >
                          <Ionicons name="download-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Prompt */}
              <View style={styles.section}>
                <View style={styles.promptHeader}>
                  <Text style={styles.sectionTitle}>Prompt</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(history.prompt, 'prompt')}
                  >
                    <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                    <Text style={styles.copyButtonText}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.promptBox}>
                  <Text style={styles.promptText}>{history.prompt}</Text>
                </View>
              </View>

              {/* Negative Prompt */}
              {history.negativePrompt && (
                <View style={styles.section}>
                  <View style={styles.promptHeader}>
                    <Text style={styles.sectionTitle}>Negative Prompt</Text>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(history.negativePrompt!, 'negative')}
                    >
                      <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.promptBox}>
                    <Text style={styles.promptText}>{history.negativePrompt}</Text>
                  </View>
                </View>
              )}

              {/* Parameters */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Parameters</Text>
                <View style={styles.parametersGrid}>
                  <View style={styles.parameter}>
                    <Text style={styles.parameterLabel}>Steps</Text>
                    <Text style={styles.parameterValue}>{history.steps}</Text>
                  </View>
                  <View style={styles.parameter}>
                    <Text style={styles.parameterLabel}>Guidance Scale</Text>
                    <Text style={styles.parameterValue}>{history.guidanceScale}</Text>
                  </View>
                  <View style={styles.parameter}>
                    <Text style={styles.parameterLabel}>LoRA Scale</Text>
                    <Text style={styles.parameterValue}>{history.loraScale}</Text>
                  </View>
                  <View style={styles.parameter}>
                    <Text style={styles.parameterLabel}>Images</Text>
                    <Text style={styles.parameterValue}>{history.numImages}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgDark,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    flex: 1,
    padding: Spacing.lg,
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modelTitle: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  imageCard: {
    position: 'relative',
    marginRight: Spacing.md,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  image: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    backgroundColor: Colors.bgHover,
  },
  downloadButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  copyButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  promptBox: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  promptText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  parameter: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  parameterLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  parameterValue: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.primary,
  },
});

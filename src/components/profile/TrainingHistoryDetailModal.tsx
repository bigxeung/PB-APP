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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../../constants/theme';
import { trainingAPI } from '../../services/api';
import type { TrainingJobResponse } from '../../types';

interface TrainingHistoryDetailModalProps {
  visible: boolean;
  onClose: () => void;
  jobId: number | null;
  onDeleted?: (id: number) => void;
}

export default function TrainingHistoryDetailModal({
  visible,
  onClose,
  jobId,
  onDeleted,
}: TrainingHistoryDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<TrainingJobResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && jobId) {
      loadJobDetails();
    }
  }, [visible, jobId]);

  const loadJobDetails = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      setError('');
      const jobs = await trainingAPI.getTrainingHistory();
      const foundJob = jobs.find(j => j.id === jobId);
      if (foundJob) {
        setJob(foundJob);
      } else {
        setError('Training job not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load training details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!jobId) return;

    Alert.alert(
      'Delete Training',
      'Are you sure you want to delete this training record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await trainingAPI.deleteTrainingJob(jobId);
              onDeleted?.(jobId);
              onClose();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete training job');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return styles.statusSuccess;
      case 'TRAINING':
      case 'IN_PROGRESS':
        return styles.statusGenerating;
      case 'FAILED':
        return styles.statusFailed;
      default:
        return styles.statusGenerating;
    }
  };

  const formatLearningRate = (rate: number) => {
    return rate.toExponential(1);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Training Details</Text>
            <View style={styles.headerActions}>
              {job && (
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
          ) : job ? (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Status Badge */}
              <View style={[styles.statusBadge, getStatusColor(job.status)]}>
                <Text style={styles.statusText}>{job.status}</Text>
              </View>

              {/* Model Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Model</Text>
                <Text style={styles.modelTitle}>{job.modelName}</Text>
                {job.modelDescription && (
                  <Text style={styles.modelDescription}>{job.modelDescription}</Text>
                )}
                <Text style={styles.date}>
                  {new Date(job.createdAt).toLocaleString()}
                </Text>
              </View>

              {/* Training Progress */}
              {(job.status === 'TRAINING' || job.status === 'IN_PROGRESS') && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Progress</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Training Progress</Text>
                      <Text style={styles.progressValue}>
                        Epoch {job.currentEpoch || 0} / {job.totalEpochs || job.epochs}
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${((job.currentEpoch || 0) / (job.totalEpochs || job.epochs)) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.progressFooter}>
                      <Text style={styles.progressPercentage}>
                        {Math.round(((job.currentEpoch || 0) / (job.totalEpochs || job.epochs)) * 100)}% Complete
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Training Images */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Training Data</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Images</Text>
                  <Text style={styles.infoValue}>{job.trainingImagesCount}</Text>
                </View>
                {job.triggerWord && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Trigger Word</Text>
                    <Text style={styles.infoValue}>{job.triggerWord}</Text>
                  </View>
                )}
              </View>

              {/* Hyperparameters */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hyperparameters</Text>
                <View style={styles.parametersGrid}>
                  <View style={styles.parameter}>
                    <Text style={styles.parameterLabel}>Learning Rate</Text>
                    <Text style={styles.parameterValue}>
                      {formatLearningRate(job.learningRate)}
                    </Text>
                  </View>
                  <View style={styles.parameter}>
                    <Text style={styles.parameterLabel}>Epochs</Text>
                    <Text style={styles.parameterValue}>{job.epochs}</Text>
                  </View>
                  <View style={styles.parameter}>
                    <Text style={styles.parameterLabel}>LoRA Rank</Text>
                    <Text style={styles.parameterValue}>{job.loraRank}</Text>
                  </View>
                  <View style={styles.parameter}>
                    <Text style={styles.parameterLabel}>Base Model</Text>
                    <Text style={[styles.parameterValue, styles.baseModelValue]}>
                      {job.baseModel}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Error Message (if failed) */}
              {job.status === 'FAILED' && job.errorMessage && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Error</Text>
                  <View style={styles.errorBox}>
                    <Text style={styles.errorMessageText}>{job.errorMessage}</Text>
                  </View>
                </View>
              )}
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
    fontWeight: '600',
  },
  modelDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.bgHover,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  progressFooter: {
    marginTop: Spacing.xs,
  },
  progressPercentage: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  parametersGrid: {
    gap: Spacing.md,
  },
  parameter: {
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
  baseModelValue: {
    fontSize: FontSizes.sm,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorMessageText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    lineHeight: 20,
  },
});

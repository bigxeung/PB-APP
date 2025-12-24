import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import type { LoraModel } from '../../types';

// conference(front)/src/components/generate/GenerateModal.vue 참고
interface GenerateModalProps {
  visible: boolean;
  onClose: () => void;
  initialModelId?: number | null;
}

export default function GenerateModal({ visible, onClose, initialModelId }: GenerateModalProps) {
  const { isAuthenticated } = useAuth();
  const [selectedModel, setSelectedModel] = useState<LoraModel | null>(null);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(
    'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality'
  );
  const [steps, setSteps] = useState(30);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [loraScale, setLoraScale] = useState(1.0);
  const [numImages, setNumImages] = useState(1);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const [showModelPicker, setShowModelPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setGeneratedImages([]);
      setError('');
      setPrompt('');
      setSelectedModel(null);
      setIsGenerating(false);
      setCurrentStep(0);
      setTotalSteps(0);
      setStatusMessage('');
    }
  }, [visible]);

  const handleAuthCheck = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to use this feature');
      return false;
    }
    return true;
  };

  const handleSelectModel = () => {
    if (!handleAuthCheck()) return;
    setShowModelPicker(true);
  };

  const handleStartGeneration = () => {
    if (!handleAuthCheck()) return;

    if (!selectedModel) {
      Alert.alert('Error', 'Please select a model first');
      return;
    }

    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    // 실제 구현은 나중에
    Alert.alert('Info', 'Generation feature will be implemented soon');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Image Generation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.contentWrapper}>
              {/* Configuration Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Configuration</Text>

                {/* Model Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Select Model</Text>
                  <TouchableOpacity
                    style={styles.modelSelectButton}
                    onPress={handleSelectModel}
                    disabled={isGenerating}
                  >
                    {selectedModel ? (
                      <View style={styles.selectedModelInfo}>
                        <Text style={styles.selectedModelTitle}>{selectedModel.title}</Text>
                        <Text style={styles.selectedModelSubtitle}>
                          by {selectedModel.userNickname}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.placeholderText}>Choose a model...</Text>
                    )}
                    <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Prompt */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Prompt</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={prompt}
                    onChangeText={setPrompt}
                    placeholder="1girl, beautiful, detailed face, high quality..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={4}
                    onFocus={handleAuthCheck}
                    editable={!isGenerating}
                  />
                </View>

                {/* Negative Prompt */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Negative Prompt</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={negativePrompt}
                    onChangeText={setNegativePrompt}
                    placeholder="lowres, bad anatomy..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={3}
                    editable={!isGenerating}
                  />
                </View>

                {/* Parameters */}
                <View style={styles.parametersGrid}>
                  <View style={styles.parameterRow}>
                    <View style={styles.parameterItem}>
                      <Text style={styles.label}>Steps: {steps}</Text>
                      {/* Slider would go here */}
                    </View>

                    <View style={styles.parameterItem}>
                      <Text style={styles.label}>Guidance: {guidanceScale}</Text>
                      {/* Slider would go here */}
                    </View>
                  </View>

                  <View style={styles.parameterRow}>
                    <View style={styles.parameterItem}>
                      <Text style={styles.label}>LoRA Weight: {loraScale.toFixed(2)}</Text>
                      {/* Slider would go here */}
                    </View>

                    <View style={styles.parameterItem}>
                      <Text style={styles.label}>Images</Text>
                      <TextInput
                        style={styles.input}
                        value={String(numImages)}
                        onChangeText={(text) => setNumImages(Number(text) || 1)}
                        keyboardType="number-pad"
                        editable={!isGenerating}
                      />
                    </View>
                  </View>
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    (isGenerating || !selectedModel) && styles.generateButtonDisabled,
                  ]}
                  onPress={handleStartGeneration}
                  disabled={isGenerating || !selectedModel}
                >
                  {isGenerating && (
                    <ActivityIndicator color={Colors.textPrimary} style={styles.buttonLoader} />
                  )}
                  <Text style={styles.generateButtonText}>
                    {isGenerating ? 'Generating...' : 'Generate Images'}
                  </Text>
                </TouchableOpacity>

                {/* Error Message */}
                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Progress */}
                {isGenerating && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>{statusMessage}</Text>
                      {totalSteps > 0 && (
                        <Text style={styles.progressValue}>
                          {currentStep} / {totalSteps}
                        </Text>
                      )}
                    </View>
                    {totalSteps > 0 && (
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${(currentStep / totalSteps) * 100}%` },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Generated Images Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Generated Images</Text>
                {generatedImages.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="image-outline" size={64} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>Your generated images will appear here</Text>
                    <Text style={styles.emptyHint}>Configure your settings and click Generate</Text>
                  </View>
                ) : (
                  <View style={styles.imagesGrid}>
                    {/* Generated images would be displayed here */}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
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
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  scrollContent: {
    flex: 1,
  },
  contentWrapper: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  modelSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedModelInfo: {
    flex: 1,
  },
  selectedModelTitle: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  selectedModelSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  parametersGrid: {
    gap: Spacing.md,
  },
  parameterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  parameterItem: {
    flex: 1,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: Spacing.lg,
    ...Shadows.glow,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  buttonLoader: {
    marginRight: Spacing.sm,
  },
  generateButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
  },
  progressSection: {
    marginTop: Spacing.lg,
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
  },
  progressValue: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
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
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.full,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyHint: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  imagesGrid: {
    // Images grid styles
  },
});

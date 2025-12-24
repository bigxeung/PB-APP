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
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { modelsAPI, generateAPI } from '../../services/api';
import type { LoraModel, GenerationHistoryResponse, GenerateConfig } from '../../types';

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
  const [myModels, setMyModels] = useState<LoraModel[]>([]);
  const [communityModels, setCommunityModels] = useState<LoraModel[]>([]);
  const [modelPickerTab, setModelPickerTab] = useState<'my' | 'community'>('my');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Example prompts (conference(front) 참고)
  const [examplePrompt, setExamplePrompt] = useState<{ prompt: string; negativePrompt: string } | null>(null);
  const [positiveCopied, setPositiveCopied] = useState(false);
  const [negativeCopied, setNegativeCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setGeneratedImages([]);
      setError('');
      setPrompt('');
      setIsGenerating(false);
      setCurrentStep(0);
      setTotalSteps(0);
      setStatusMessage('');

      // Load initial model if initialModelId is provided
      if (initialModelId) {
        loadInitialModel(initialModelId);
      } else {
        setSelectedModel(null);
      }
    }
  }, [visible, initialModelId]);

  useEffect(() => {
    if (showModelPicker && isAuthenticated) {
      loadModels();
    }
  }, [showModelPicker, isAuthenticated]);

  const loadInitialModel = async (modelId: number) => {
    try {
      const modelDetail = await modelsAPI.getModelDetail(modelId);
      if (modelDetail.status === 'COMPLETED') {
        setSelectedModel(modelDetail);
        // Set example prompt if available
        if (modelDetail.prompts && modelDetail.prompts.length > 0) {
          const firstPrompt = modelDetail.prompts[0];
          setExamplePrompt({
            prompt: firstPrompt.prompt,
            negativePrompt: firstPrompt.negativePrompt,
          });
        } else {
          setExamplePrompt(null);
        }
      } else {
        Alert.alert('Error', 'This model is not ready for generation yet');
      }
    } catch (error: any) {
      console.error('Failed to load initial model:', error);
      Alert.alert('Error', 'Failed to load model');
    }
  };

  const handleAuthCheck = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to use this feature');
      return false;
    }
    return true;
  };

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const [myModelsResponse, communityModelsResponse] = await Promise.all([
        modelsAPI.getMyModels(0, 50),
        modelsAPI.getPublicModels(0, 50),
      ]);

      // Filter only COMPLETED models
      setMyModels(myModelsResponse.content.filter(m => m.status === 'COMPLETED'));
      setCommunityModels(communityModelsResponse.content.filter(m => m.status === 'COMPLETED'));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSelectModel = () => {
    if (!handleAuthCheck()) return;
    setShowModelPicker(true);
  };

  const handleModelSelect = async (model: LoraModel) => {
    // Fetch full model details to get prompts
    try {
      const modelDetail = await modelsAPI.getModelDetail(model.id);
      setSelectedModel(modelDetail);
      // Set example prompt if available
      if (modelDetail.prompts && modelDetail.prompts.length > 0) {
        const firstPrompt = modelDetail.prompts[0];
        setExamplePrompt({
          prompt: firstPrompt.prompt,
          negativePrompt: firstPrompt.negativePrompt,
        });
      } else {
        setExamplePrompt(null);
      }
    } catch (error: any) {
      console.error('Failed to load model details:', error);
      // Fallback to basic model info
      setSelectedModel(model);
      setExamplePrompt(null);
    }
    setShowModelPicker(false);
  };

  const pollGenerationProgress = async (userId: number, historyId: number) => {
    const maxAttempts = 300; // 5 minutes with 1s interval
    let attempts = 0;

    const poll = async () => {
      try {
        const progress = await generateAPI.getGenerationProgress(userId, historyId);

        if (progress.current_step !== undefined && progress.total_steps !== undefined) {
          // Only update if step is greater to prevent race conditions
          setCurrentStep(prev => Math.max(prev, progress.current_step || 0));
          setTotalSteps(progress.total_steps);
        }

        if (progress.message) {
          setStatusMessage(progress.message);
        }

        if (progress.status === 'SUCCESS') {
          if (progress.image_urls && progress.image_urls.length > 0) {
            setGeneratedImages(progress.image_urls);
          }
          setIsGenerating(false);
          setStatusMessage('Generation completed!');
          return;
        } else if (progress.status === 'FAILED') {
          setError(progress.error || 'Generation failed');
          setIsGenerating(false);
          return;
        }

        // Continue polling
        if (attempts < maxAttempts && progress.status === 'IN_PROGRESS') {
          attempts++;
          setTimeout(poll, 1000);
        } else if (attempts >= maxAttempts) {
          setError('Generation timeout');
          setIsGenerating(false);
        }
      } catch (error: any) {
        console.error('Progress polling error:', error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setError('Failed to get generation progress');
          setIsGenerating(false);
        }
      }
    };

    poll();
  };

  // Copy to clipboard (conference(front) 참고)
  const copyToClipboard = async (text: string, type: 'positive' | 'negative') => {
    try {
      await Clipboard.setStringAsync(text);
      if (type === 'positive') {
        setPositiveCopied(true);
        setTimeout(() => setPositiveCopied(false), 1500);
      } else {
        setNegativeCopied(true);
        setTimeout(() => setNegativeCopied(false), 1500);
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  // Download image (conference(front) 참고)
  const downloadImage = async (url: string, index: number) => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library access to download images');
        return;
      }

      // Download file
      const filename = `generated-${Date.now()}-${index}.png`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      // Save to media library
      if (downloadResult.uri) {
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
        Alert.alert('Success', 'Image saved to gallery');
      }
    } catch (error) {
      console.error('Failed to download image:', error);
      Alert.alert('Error', 'Failed to download image');
    }
  };

  const handleStartGeneration = async () => {
    if (!handleAuthCheck()) return;

    if (!selectedModel) {
      Alert.alert('Error', 'Please select a model first');
      return;
    }

    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedImages([]);
    setCurrentStep(0);
    setTotalSteps(0);
    setStatusMessage('Starting generation...');

    try {
      const config: GenerateConfig = {
        modelId: selectedModel.id,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        steps,
        guidanceScale,
        loraScale,
        numImages,
      };

      const result = await generateAPI.generateImage(config);

      // Start polling for progress
      if (result.userId && result.id) {
        pollGenerationProgress(result.userId, result.id);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to start generation');
      setIsGenerating(false);
    }
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

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.contentWrapper}
            showsVerticalScrollIndicator={false}
          >
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

                {/* Example Prompts (conference(front) 참고) */}
                {examplePrompt && (
                  <View style={styles.examplePromptSection}>
                    <View style={styles.examplePromptHeader}>
                      <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
                      <Text style={styles.examplePromptTitle}>Example Prompts</Text>
                    </View>

                    <View style={styles.examplePromptBox}>
                      <View style={styles.examplePromptLabelRow}>
                        <Text style={styles.examplePromptLabel}>Positive Prompt</Text>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(examplePrompt.prompt, 'positive')}
                        >
                          <Ionicons
                            name={positiveCopied ? "checkmark" : "copy-outline"}
                            size={16}
                            color={positiveCopied ? Colors.success : Colors.textSecondary}
                          />
                          <Text style={[
                            styles.copyButtonText,
                            positiveCopied && styles.copyButtonTextSuccess
                          ]}>
                            {positiveCopied ? 'Copied!' : 'Copy'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.examplePromptText}>{examplePrompt.prompt}</Text>
                    </View>

                    <View style={styles.examplePromptBox}>
                      <View style={styles.examplePromptLabelRow}>
                        <Text style={styles.examplePromptLabel}>Negative Prompt</Text>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(examplePrompt.negativePrompt, 'negative')}
                        >
                          <Ionicons
                            name={negativeCopied ? "checkmark" : "copy-outline"}
                            size={16}
                            color={negativeCopied ? Colors.success : Colors.textSecondary}
                          />
                          <Text style={[
                            styles.copyButtonText,
                            negativeCopied && styles.copyButtonTextSuccess
                          ]}>
                            {negativeCopied ? 'Copied!' : 'Copy'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.examplePromptText}>{examplePrompt.negativePrompt}</Text>
                    </View>
                  </View>
                )}

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
                      <Slider
                        style={styles.slider}
                        minimumValue={10}
                        maximumValue={100}
                        step={5}
                        value={steps}
                        onValueChange={setSteps}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.border}
                        thumbTintColor={Colors.primary}
                        disabled={isGenerating}
                      />
                    </View>

                    <View style={styles.parameterItem}>
                      <Text style={styles.label}>Guidance: {guidanceScale.toFixed(1)}</Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={20}
                        step={0.5}
                        value={guidanceScale}
                        onValueChange={setGuidanceScale}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.border}
                        thumbTintColor={Colors.primary}
                        disabled={isGenerating}
                      />
                    </View>
                  </View>

                  <View style={styles.parameterRow}>
                    <View style={styles.parameterItem}>
                      <Text style={styles.label}>LoRA Weight: {loraScale.toFixed(2)}</Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={2}
                        step={0.05}
                        value={loraScale}
                        onValueChange={setLoraScale}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.border}
                        thumbTintColor={Colors.primary}
                        disabled={isGenerating}
                      />
                    </View>

                    <View style={styles.parameterItem}>
                      <Text style={styles.label}>Images: {numImages}</Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={4}
                        step={1}
                        value={numImages}
                        onValueChange={setNumImages}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor={Colors.border}
                        thumbTintColor={Colors.primary}
                        disabled={isGenerating}
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
                    {generatedImages.map((imageUrl, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <View style={styles.imageContainer}>
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.generatedImage}
                            resizeMode="cover"
                          />
                        </View>
                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={() => downloadImage(imageUrl, index)}
                        >
                          <Ionicons name="download-outline" size={16} color={Colors.textPrimary} />
                          <Text style={styles.downloadButtonText}>Download</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
          </ScrollView>
        </View>
      </View>

      {/* Model Picker Modal */}
      <Modal
        visible={showModelPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModelPicker(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            {/* Picker Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Model</Text>
              <TouchableOpacity
                onPress={() => setShowModelPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, modelPickerTab === 'my' && styles.tabActive]}
                onPress={() => setModelPickerTab('my')}
              >
                <Text
                  style={[styles.tabText, modelPickerTab === 'my' && styles.tabTextActive]}
                >
                  My Models ({myModels.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, modelPickerTab === 'community' && styles.tabActive]}
                onPress={() => setModelPickerTab('community')}
              >
                <Text
                  style={[
                    styles.tabText,
                    modelPickerTab === 'community' && styles.tabTextActive,
                  ]}
                >
                  Community ({communityModels.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Model List */}
            <ScrollView style={styles.modelList} showsVerticalScrollIndicator={false}>
              {isLoadingModels ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading models...</Text>
                </View>
              ) : (modelPickerTab === 'my' ? myModels : communityModels).length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={48} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>
                    {modelPickerTab === 'my'
                      ? 'No trained models yet.\nTrain your first model to get started!'
                      : 'No community models available'}
                  </Text>
                </View>
              ) : (
                <>
                  {(modelPickerTab === 'my' ? myModels : communityModels).map((model) => (
                    <TouchableOpacity
                      key={model.id}
                      style={[
                        styles.modelItem,
                        selectedModel?.id === model.id && styles.modelItemSelected,
                      ]}
                      onPress={() => handleModelSelect(model)}
                    >
                      {model.thumbnailUrl && (
                        <Image
                          source={{ uri: model.thumbnailUrl }}
                          style={styles.modelThumbnail}
                        />
                      )}
                      <View style={styles.modelInfo}>
                        <Text style={styles.modelTitle}>{model.title}</Text>
                        <Text style={styles.modelAuthor}>by {model.userNickname}</Text>
                        <View style={styles.modelStats}>
                          <View style={styles.stat}>
                            <Ionicons name="heart" size={14} color={Colors.textMuted} />
                            <Text style={styles.statText}>{model.likeCount}</Text>
                          </View>
                          <View style={styles.stat}>
                            <Ionicons name="eye" size={14} color={Colors.textMuted} />
                            <Text style={styles.statText}>{model.viewCount}</Text>
                          </View>
                        </View>
                      </View>
                      {selectedModel?.id === model.id && (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}

                  {(modelPickerTab === 'my' ? myModels : communityModels).length === 0 && (
                    <View style={styles.emptyState}>
                      <Ionicons name="cube-outline" size={64} color={Colors.textMuted} />
                      <Text style={styles.emptyText}>
                        {modelPickerTab === 'my'
                          ? 'No models found. Train a model first!'
                          : 'No community models available'}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    height: '90%',
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
  },
  section: {
    marginBottom: Spacing.lg,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  imageWrapper: {
    width: (Dimensions.get('window').width - Spacing.lg * 2 - Spacing.md) / 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
  downloadButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  downloadButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  examplePromptSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  examplePromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  examplePromptTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.primary,
  },
  examplePromptBox: {
    marginBottom: Spacing.sm,
  },
  examplePromptLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  examplePromptLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  examplePromptText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    backgroundColor: Colors.bgCard,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard,
  },
  copyButtonText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  copyButtonTextSuccess: {
    color: Colors.success,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: Colors.bgDark,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    height: '80%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  modelList: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  modelItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  modelThumbnail: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    marginRight: Spacing.md,
    backgroundColor: Colors.bgHover,
  },
  modelInfo: {
    flex: 1,
  },
  modelTitle: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  modelAuthor: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  modelStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
});

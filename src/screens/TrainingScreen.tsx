import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TopNavigation from '../components/TopNavigation';
import { trainingAPI, uploadAPI } from '../services/api';
import type { TrainConfig } from '../types';

// conference(front)/src/views/Training.vue 참고
interface SelectedImage {
  uri: string;
  fileName: string;
  mimeType: string;
}

export default function TrainingScreen() {
  const { isAuthenticated, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [learningRate, setLearningRate] = useState(0.0001);
  const [epochs, setEpochs] = useState(10);
  const loraRankOptions = [16, 32, 64];
  const [loraRankIndex, setLoraRankIndex] = useState(1); // Default to 32 (index 1)
  const loraRank = loraRankOptions[loraRankIndex];
  const [baseModel, setBaseModel] = useState('Lykon/AnyLoRA'); // Default: AnyLoRA
  const [showAdvanced, setShowAdvanced] = useState(true); // Advanced 섹션 접기/펼치기 - 기본 펼침

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [totalEpochs, setTotalEpochs] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [phase, setPhase] = useState('');
  const [trainingJobId, setTrainingJobId] = useState<number | null>(null);

  // Request permission on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera roll permission is required to upload images');
        }
      }
    })();
  }, []);

  // Format learning rate to show integer coefficient (1e-4 instead of 1.0e-4)
  const formatLearningRate = (rate: number) => {
    const exp = Math.floor(Math.log10(rate));
    const coef = rate / Math.pow(10, exp);
    const roundedCoef = Math.round(coef);
    return `${roundedCoef}e${exp}`;
  };

  // Calculate recommended epochs based on image count and learning rate
  // conference(front)/src/components/training/TrainingForm.vue 참고
  useEffect(() => {
    const imageCount = selectedImages.length;
    console.log(`🔄 이미지 개수 변경 감지: ${imageCount}개`);

    if (imageCount > 0) {
      const currentLearningRate = learningRate;

      // 1. 목표: 최소 1500스텝은 하되, 이미지가 많으면 장당 100스텝 비율로 늘림
      const targetSteps = Math.max(1500, imageCount * 100);

      // 2. 학습률 보정(LR) + 에포크 환산(나누기)
      const calculatedEpochs = Math.max(10, Math.floor((targetSteps * (0.0001 / currentLearningRate)) / imageCount));

      console.log(`📊 Epoch 자동 계산: 이미지 ${imageCount}개, LR ${formatLearningRate(currentLearningRate)} → ${calculatedEpochs} epochs`);
      setEpochs(calculatedEpochs);
    } else {
      console.log(`⚠️ 이미지가 없어서 epoch 초기화: 10`);
      setEpochs(10);
    }
  }, [selectedImages.length, learningRate]);

  const handleAuthCheck = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to use this feature');
      return false;
    }
    return true;
  };

  const handlePickImages = async () => {
    if (!handleAuthCheck()) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const newImages: SelectedImage[] = result.assets.map((asset, index) => ({
          uri: asset.uri,
          fileName: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        }));

        setSelectedImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToS3 = async (): Promise<string[]> => {
    if (selectedImages.length === 0) {
      throw new Error('No images selected');
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get presigned URLs
      const fileNames = selectedImages.map((img) => img.fileName);
      const presignedUrls = await uploadAPI.getPresignedUrls(fileNames);

      // Upload each image
      const uploadedKeys: string[] = [];
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const presignedUrl = presignedUrls[i];

        // Fetch the image as blob
        const response = await fetch(image.uri);
        const blob = await response.blob();

        // Upload to S3
        await uploadAPI.uploadToS3(presignedUrl.uploadUrl, blob);

        uploadedKeys.push(presignedUrl.s3Key);
        setUploadProgress(((i + 1) / selectedImages.length) * 100);
      }

      return uploadedKeys;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const pollTrainingProgress = async (jobId: number) => {
    const maxAttempts = 7200; // 2 hours with 1s interval
    let attempts = 0;

    const poll = async () => {
      try {
        const activeJob = await trainingAPI.getMyActiveTrainingJob();

        if (!activeJob || activeJob.id !== jobId) {
          setIsTraining(false);
          return;
        }

        setCurrentEpoch(activeJob.currentEpoch || 0);
        setTotalEpochs(activeJob.totalEpochs || activeJob.epochs);
        setPhase(activeJob.phase || '');

        if (activeJob.status === 'COMPLETED') {
          setStatusMessage('Training completed successfully!');
          setIsTraining(false);
          Alert.alert('Success', 'Your model has been trained successfully!');
          // Reset form
          setTitle('');
          setDescription('');
          setTriggerWord('');
          setSelectedImages([]);
          setTrainingJobId(null);
          return;
        } else if (activeJob.status === 'FAILED') {
          setStatusMessage(activeJob.errorMessage || 'Training failed');
          setIsTraining(false);
          Alert.alert('Error', activeJob.errorMessage || 'Training failed');
          setTrainingJobId(null);
          return;
        }

        // Update status message based on phase
        if (activeJob.phase === 'PREPROCESSING') {
          setStatusMessage('Preprocessing images...');
        } else if (activeJob.phase === 'TRAINING') {
          setStatusMessage(`Training epoch ${activeJob.currentEpoch}/${activeJob.totalEpochs}...`);
        } else if (activeJob.phase === 'UPLOADING') {
          setStatusMessage('Uploading model...');
        } else {
          setStatusMessage(activeJob.phase || 'Processing...');
        }

        // Continue polling
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setStatusMessage('Training timeout - please check training history');
          setIsTraining(false);
        }
      } catch (error) {
        console.error('Training progress poll error:', error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setStatusMessage('Failed to get training progress');
          setIsTraining(false);
        }
      }
    };

    poll();
  };

  const handleStartTraining = async () => {
    if (!handleAuthCheck()) return;

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a model title');
      return;
    }

    if (selectedImages.length < 10) {
      Alert.alert('Error', 'Please upload at least 10 images');
      return;
    }

    if (selectedImages.length > 40) {
      Alert.alert('Error', 'Maximum 40 images allowed');
      return;
    }

    setIsTraining(true);
    setStatusMessage('Uploading images...');

    try {
      // Upload images to S3
      const imageKeys = await uploadImagesToS3();

      setStatusMessage('Starting training...');

      // Start training
      const trainConfig: TrainConfig = {
        title: title.trim(),
        description: description.trim() || undefined,
        triggerWord: triggerWord.trim() || undefined,
        epochs,
        learningRate,
        loraRank,
        baseModel,
        isPublic: false,
        skipPreprocessing: false,
        imageKeys,
      };

      const job = await trainingAPI.startTraining(trainConfig);

      setTrainingJobId(job.id);
      setTotalEpochs(job.epochs);
      setStatusMessage('Training started...');

      // Start polling for progress
      pollTrainingProgress(job.id);
    } catch (error: any) {
      console.error('Training start error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start training');
      setIsTraining(false);
      setStatusMessage('');
    }
  };

  const { isDark } = useTheme();
  const bgColor = isDark ? Colors.bgDark : '#FFFFFF';
  const textColor = isDark ? Colors.textPrimary : '#000';
  const secondaryTextColor = isDark ? Colors.textSecondary : '#666';
  const mutedTextColor = isDark ? Colors.textMuted : '#999';
  const cardBgColor = isDark ? Colors.bgCard : '#F5F5F5';
  const borderColor = isDark ? Colors.border : '#E0E0E0';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <TopNavigation showSearch={false} />
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: bgColor }]}>
          <View style={styles.animationContainer}>
            <View style={styles.shape1} />
            <View style={styles.shape2} />
            <View style={styles.shape3} />
          </View>

          <Text style={[styles.heroTitle, { color: textColor }]}>Craft Your AI Masterpiece</Text>
          <Text style={[styles.heroSubtitle, { color: secondaryTextColor }]}>
            Bring your vision to life by training a custom LoRA model.{'\n'}
            Just upload your images, and we'll handle the rest.
          </Text>
        </View>

      {/* Training Form Card */}
      <View style={styles.formContainer}>
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Training Configuration</Text>

          {/* Model Title */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: secondaryTextColor }]}>Model Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: cardBgColor, borderColor, color: textColor }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter your model name..."
              placeholderTextColor={mutedTextColor}
              onFocus={handleAuthCheck}
              editable={!isTraining}
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: secondaryTextColor }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cardBgColor, borderColor, color: textColor }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your model..."
              placeholderTextColor={mutedTextColor}
              multiline
              numberOfLines={4}
              onFocus={handleAuthCheck}
              editable={!isTraining}
            />
          </View>

          {/* Trigger Word */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: secondaryTextColor }]}>Trigger Word</Text>
            <TextInput
              style={[styles.input, { backgroundColor: cardBgColor, borderColor, color: textColor }]}
              value={triggerWord}
              onChangeText={setTriggerWord}
              placeholder="e.g., ohwx, sks..."
              placeholderTextColor={mutedTextColor}
              onFocus={handleAuthCheck}
              editable={!isTraining}
            />
          </View>

          {/* Advanced Parameters Section */}
          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.advancedHeader}
              onPress={() => setShowAdvanced(!showAdvanced)}
              activeOpacity={0.8}
            >
              <View style={styles.advancedHeaderLeft}>
                <Ionicons name="settings" size={22} color="#fff" />
                <Text style={styles.advancedTitle}>
                  Hyperparameters
                </Text>
              </View>
              <Ionicons
                name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            {showAdvanced && (
              <View style={styles.parametersGrid}>
                {/* Learning Rate */}
                <View style={styles.parameterItem}>
                  <View style={styles.parameterHeader}>
                    <Text style={[styles.label, { color: secondaryTextColor }]}>
                      Learning Rate
                    </Text>
                    <Text style={[styles.parameterValue, { color: textColor }]}>
                      {formatLearningRate(learningRate)}
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.00002}
                    maximumValue={0.0002}
                    step={0.00001}
                    value={learningRate}
                    onValueChange={setLearningRate}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={Colors.primary}
                    disabled={isTraining}
                  />
                  <View style={styles.rangeLabels}>
                    <Text style={[styles.rangeLabel, { color: mutedTextColor }]}>2e-5</Text>
                    <Text style={[styles.rangeLabel, { color: mutedTextColor }]}>1e-4 (권장)</Text>
                    <Text style={[styles.rangeLabel, { color: mutedTextColor }]}>2e-4</Text>
                  </View>
                </View>

                {/* Epochs */}
                <View style={styles.parameterItem}>
                  <View style={styles.parameterHeader}>
                    <Text style={[styles.label, { color: secondaryTextColor }]}>
                      Epochs
                    </Text>
                    <Text style={[styles.parameterValue, { color: textColor }]}>
                      {epochs}
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={5}
                    maximumValue={250}
                    step={5}
                    value={epochs}
                    onValueChange={setEpochs}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={Colors.primary}
                    disabled={isTraining}
                  />
                  <View style={styles.rangeLabels}>
                    <Text style={[styles.rangeLabel, { color: mutedTextColor }]}>5</Text>
                    <Text style={[styles.rangeLabel, { color: mutedTextColor }]}>250</Text>
                  </View>
                  <Text style={[styles.parameterHint, { color: mutedTextColor }]}>
                    학습률과 이미지 수에 따라 자동 계산됨
                  </Text>
                </View>

                {/* Base Model */}
                <View style={styles.parameterItem}>
                  <View style={styles.parameterHeader}>
                    <Text style={[styles.label, { color: secondaryTextColor }]}>
                      Base Model
                    </Text>
                  </View>
                  <View style={styles.baseModelSelector}>
                    <TouchableOpacity
                      style={[
                        styles.baseModelOption,
                        baseModel === 'Lykon/AnyLoRA' && styles.baseModelOptionActive
                      ]}
                      onPress={() => setBaseModel('Lykon/AnyLoRA')}
                      disabled={isTraining}
                    >
                      <Text style={[
                        styles.baseModelText,
                        baseModel === 'Lykon/AnyLoRA' && styles.baseModelTextActive
                      ]}>AnyLoRA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.baseModelOption,
                        baseModel === 'stablediffusionapi/anything-v5' && styles.baseModelOptionActive
                      ]}
                      onPress={() => setBaseModel('stablediffusionapi/anything-v5')}
                      disabled={isTraining}
                    >
                      <Text style={[
                        styles.baseModelText,
                        baseModel === 'stablediffusionapi/anything-v5' && styles.baseModelTextActive
                      ]}>Anything V5</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* LoRA Rank */}
                <View style={styles.parameterItem}>
                  <View style={styles.parameterHeader}>
                    <Text style={[styles.label, { color: secondaryTextColor }]}>
                      LoRA Rank
                    </Text>
                    <Text style={[styles.parameterValue, { color: textColor }]}>
                      {loraRank}
                    </Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={2}
                    step={1}
                    value={loraRankIndex}
                    onValueChange={(value) => setLoraRankIndex(Math.round(value))}
                    minimumTrackTintColor={Colors.primary}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={Colors.primary}
                    disabled={isTraining}
                  />
                  <View style={styles.rangeLabels}>
                    <Text style={[styles.rangeLabel, { color: mutedTextColor }]}>16</Text>
                    <Text style={[styles.rangeLabel, { color: mutedTextColor }]}>32</Text>
                    <Text style={[styles.rangeLabel, { color: mutedTextColor }]}>64</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Image Upload Section */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: secondaryTextColor }]}>Training Images *</Text>
              <Text style={styles.imageCount}>
                {selectedImages.length} / 40 images
                {selectedImages.length < 10 && ' (min 10 required)'}
              </Text>
            </View>

            {selectedImages.length === 0 ? (
              <TouchableOpacity
                style={[styles.uploadBox, { backgroundColor: cardBgColor, borderColor }]}
                onPress={handlePickImages}
                disabled={isTraining || isUploading}
              >
                <Ionicons name="cloud-upload-outline" size={48} color={mutedTextColor} />
                <Text style={[styles.uploadText, { color: secondaryTextColor }]}>Tap to upload images</Text>
                <Text style={[styles.uploadHint, { color: mutedTextColor }]}>10-40 images required (JPG, PNG, WebP)</Text>
              </TouchableOpacity>
            ) : (
              <>
                <ScrollView
                  horizontal
                  style={styles.imagePreviewScroll}
                  showsHorizontalScrollIndicator={false}
                >
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image source={{ uri: image.uri }} style={[styles.imagePreview, { backgroundColor: cardBgColor }]} />
                      {!isTraining && !isUploading && (
                        <TouchableOpacity
                          style={[styles.removeImageButton, { backgroundColor: cardBgColor }]}
                          onPress={() => handleRemoveImage(index)}
                        >
                          <Ionicons name="close-circle" size={24} color={Colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {selectedImages.length < 40 && !isTraining && !isUploading && (
                    <TouchableOpacity
                      style={[styles.addMoreButton, { borderColor, backgroundColor: cardBgColor }]}
                      onPress={handlePickImages}
                    >
                      <Ionicons name="add-circle-outline" size={48} color={Colors.primary} />
                      <Text style={styles.addMoreText}>Add More</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>

                {isUploading && (
                  <View style={styles.uploadProgressContainer}>
                    <Text style={styles.uploadProgressText}>
                      Uploading images... {Math.round(uploadProgress)}%
                    </Text>
                    <View style={[styles.progressBar, { backgroundColor: cardBgColor }]}>
                      <View
                        style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Start Training Button */}
          <TouchableOpacity
            style={[
              styles.startButton,
              (!title.trim() || isTraining || isUploading || selectedImages.length < 10) &&
                styles.startButtonDisabled,
            ]}
            onPress={handleStartTraining}
            disabled={
              !title.trim() || isTraining || isUploading || selectedImages.length < 10
            }
          >
            {(isTraining || isUploading) && <ActivityIndicator color={Colors.textPrimary} style={styles.buttonLoader} />}
            <Text style={[styles.startButtonText, { color: '#FFFFFF' }]}>
              {isUploading
                ? 'Uploading...'
                : isTraining
                ? 'Training...'
                : 'Start Training'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Training Progress Card */}
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Training Progress</Text>

          {isTraining ? (
            <View style={styles.progressSection}>
              {/* Status Message */}
              {statusMessage ? (
                <View style={styles.statusBox}>
                  <Text style={styles.statusText}>{statusMessage}</Text>
                </View>
              ) : null}

              {/* Epoch Progress */}
              {currentEpoch > 0 && totalEpochs > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: secondaryTextColor }]}>Training Progress</Text>
                    <Text style={styles.progressValue}>
                      Epoch {currentEpoch} / {totalEpochs}
                    </Text>
                  </View>

                  <View style={[styles.progressBar, { backgroundColor: cardBgColor }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${(currentEpoch / totalEpochs) * 100}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.progressFooter}>
                    <Text style={[styles.progressPercentage, { color: mutedTextColor }]}>
                      {Math.round((currentEpoch / totalEpochs) * 100)}% Complete
                    </Text>
                    <Text style={[styles.progressRemaining, { color: mutedTextColor }]}>
                      {totalEpochs - currentEpoch} epochs remaining
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.noTrainingMessage, { backgroundColor: cardBgColor, borderColor }]}>
              <Text style={[styles.noTrainingText, { color: mutedTextColor }]}>
                Training has not started yet. Upload images and start training to see progress.
              </Text>
            </View>
          )}
        </View>
      </View>
      </ScrollView>
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
    zIndex: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    marginTop: -30,
    gap: Spacing.xl,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.md,
  },
  cardTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: FontSizes.base,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  parametersGrid: {
    gap: Spacing.md,
  },
  parameterItem: {
    marginBottom: Spacing.md,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    borderWidth: 0,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  advancedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  advancedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  parameterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  parameterValue: {
    fontSize: FontSizes.base,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  parameterHint: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  baseModelSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  baseModelOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
  },
  baseModelOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  baseModelText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  baseModelTextActive: {
    color: '#fff',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: FontSizes.base,
    marginTop: Spacing.md,
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  startButton: {
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
  startButtonDisabled: {
    opacity: 0.5,
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: Colors.bgHover,
    borderTopColor: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  startButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: Spacing.md,
  },
  statusBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusText: {
    fontSize: FontSizes.base,
    color: '#60a5fa',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: FontSizes.sm,
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
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  progressPercentage: {
    fontSize: FontSizes.xs,
  },
  progressRemaining: {
    fontSize: FontSizes.xs,
  },
  noTrainingMessage: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  noTrainingText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: Spacing.xs,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeLabel: {
    fontSize: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  imageCount: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  imagePreviewScroll: {
    marginTop: Spacing.sm,
    maxHeight: 150,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: Radius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
  },
  addMoreButton: {
    width: 120,
    height: 120,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  uploadProgressContainer: {
    marginTop: Spacing.md,
  },
  uploadProgressText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  buttonLoader: {
    marginRight: Spacing.sm,
  },
});

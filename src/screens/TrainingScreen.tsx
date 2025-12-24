import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/theme';
import { useAuth } from '../context/AuthContext';

// conference(front)/src/views/Training.vue 참고
export default function TrainingScreen() {
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [learningRate, setLearningRate] = useState(0.0001);
  const [epochs, setEpochs] = useState(10);
  const [loraRank, setLoraRank] = useState(32);

  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [totalEpochs, setTotalEpochs] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const handleStartTraining = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to start training');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a model title');
      return;
    }

    Alert.alert('Info', 'Training feature will be implemented soon');
  };

  const handleAuthCheck = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to use this feature');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.animationContainer}>
          <View style={styles.shape1} />
          <View style={styles.shape2} />
          <View style={styles.shape3} />
        </View>

        <Text style={styles.heroTitle}>Craft Your AI Masterpiece</Text>
        <Text style={styles.heroSubtitle}>
          Bring your vision to life by training a custom LoRA model.{'\n'}
          Just upload your images, and we'll handle the rest.
        </Text>
      </View>

      {/* Training Form Card */}
      <View style={styles.formContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Training Configuration</Text>

          {/* Model Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Model Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter your model name..."
              placeholderTextColor={Colors.textMuted}
              onFocus={handleAuthCheck}
              editable={!isTraining}
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your model..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              onFocus={handleAuthCheck}
              editable={!isTraining}
            />
          </View>

          {/* Trigger Word */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Trigger Word</Text>
            <TextInput
              style={styles.input}
              value={triggerWord}
              onChangeText={setTriggerWord}
              placeholder="e.g., ohwx, sks..."
              placeholderTextColor={Colors.textMuted}
              onFocus={handleAuthCheck}
              editable={!isTraining}
            />
          </View>

          {/* Parameters Grid */}
          <View style={styles.parametersGrid}>
            {/* Learning Rate */}
            <View style={styles.parameterItem}>
              <Text style={styles.label}>Learning Rate</Text>
              <Text style={styles.parameterValue}>{learningRate.toExponential(0)}</Text>
              {/* Slider would go here */}
            </View>

            {/* Epochs */}
            <View style={styles.parameterItem}>
              <Text style={styles.label}>Epochs</Text>
              <TextInput
                style={styles.input}
                value={String(epochs)}
                onChangeText={(text) => setEpochs(Number(text) || 10)}
                keyboardType="number-pad"
                editable={!isTraining}
              />
            </View>

            {/* LoRA Rank */}
            <View style={styles.parameterItem}>
              <Text style={styles.label}>LoRA Rank</Text>
              <TextInput
                style={styles.input}
                value={String(loraRank)}
                onChangeText={(text) => setLoraRank(Number(text) || 32)}
                keyboardType="number-pad"
                editable={!isTraining}
              />
            </View>
          </View>

          {/* Image Upload Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Training Images *</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={handleAuthCheck}
              disabled={isTraining}
            >
              <Ionicons name="cloud-upload-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.uploadText}>Tap to upload images</Text>
              <Text style={styles.uploadHint}>10-40 images required (JPG, PNG, WebP)</Text>
            </TouchableOpacity>
          </View>

          {/* Start Training Button */}
          <TouchableOpacity
            style={[
              styles.startButton,
              (!title.trim() || isTraining) && styles.startButtonDisabled,
            ]}
            onPress={handleStartTraining}
            disabled={!title.trim() || isTraining}
          >
            {isTraining && (
              <View style={styles.loadingSpinner} />
            )}
            <Text style={styles.startButtonText}>
              {isTraining ? 'Training...' : 'Start Training'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Training Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Training Progress</Text>

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
                    <Text style={styles.progressLabel}>Training Progress</Text>
                    <Text style={styles.progressValue}>
                      Epoch {currentEpoch} / {totalEpochs}
                    </Text>
                  </View>

                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${(currentEpoch / totalEpochs) * 100}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.progressFooter}>
                    <Text style={styles.progressPercentage}>
                      {Math.round((currentEpoch / totalEpochs) * 100)}% Complete
                    </Text>
                    <Text style={styles.progressRemaining}>
                      {totalEpochs - currentEpoch} epochs remaining
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noTrainingMessage}>
              <Text style={styles.noTrainingText}>
                Training has not started yet. Upload images and start training to see progress.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  heroSection: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.bgDark,
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
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
    zIndex: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cardTitle: {
    fontSize: FontSizes['2xl'],
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
  input: {
    backgroundColor: Colors.bgHover,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
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
  parameterValue: {
    fontSize: FontSizes.base,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  uploadBox: {
    backgroundColor: Colors.bgHover,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
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
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.full,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  progressPercentage: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  progressRemaining: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  noTrainingMessage: {
    backgroundColor: Colors.bgHover,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  noTrainingText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

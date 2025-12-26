import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { userAPI, uploadAPI } from '../../services/api';
import { UserResponse } from '../../types';
import { Colors, Spacing, Radius, FontSizes } from '../../../constants/theme';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserResponse | null;
  onUpdate: (updatedUser: UserResponse) => void;
}

export default function ProfileEditModal({ visible, onClose, user, onUpdate }: ProfileEditModalProps) {
  const { isDark } = useTheme();
  const toast = useToast();

  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const bgColor = isDark ? Colors.bgDark : '#FFFFFF';
  const textColor = isDark ? Colors.textPrimary : '#000';
  const secondaryTextColor = isDark ? Colors.textSecondary : '#666';
  const cardBgColor = isDark ? Colors.bgCard : '#F5F5F5';
  const borderColor = isDark ? Colors.border : '#E0E0E0';

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setProfileImage(user.profileImageUrl || null);
      setLocalImageUri(null);
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        toast.error('Permission to access gallery is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLocalImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      toast.error('Failed to pick image');
    }
  };

  const uploadImageToS3 = async (uri: string): Promise<string> => {
    try {
      setUploading(true);

      // 파일명 생성
      const fileName = `profile_${Date.now()}.jpg`;

      // S3 Presigned URL 받기
      const [presignedData] = await uploadAPI.getPresignedUrls([fileName]);

      // 이미지를 Blob으로 변환
      const response = await fetch(uri);
      const blob = await response.blob();

      // S3에 업로드
      await uploadAPI.uploadToS3(presignedData.uploadUrl, blob);

      // S3 URL 반환
      return presignedData.s3Url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error('Nickname is required');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = profileImage;

      // 새 이미지가 선택되었으면 업로드
      if (localImageUri) {
        imageUrl = await uploadImageToS3(localImageUri);
      }

      // 프로필 업데이트
      const updatedUser = await userAPI.updateProfile({
        nickname: nickname.trim(),
        profileImageUrl: imageUrl || undefined,
      });

      toast.success('Profile updated successfully');
      onUpdate(updatedUser);
      onClose();
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // 변경사항 리셋
    if (user) {
      setNickname(user.nickname || '');
      setProfileImage(user.profileImageUrl || null);
      setLocalImageUri(null);
    }
    onClose();
  };

  const displayImageUri = localImageUri || profileImage;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={handleCancel} disabled={loading}>
              <Ionicons name="close" size={28} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading || uploading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="checkmark" size={28} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {/* Profile Image */}
            <View style={styles.imageSection}>
              <TouchableOpacity
                style={[styles.imageContainer, { backgroundColor: cardBgColor }]}
                onPress={pickImage}
                disabled={loading || uploading}
              >
                {displayImageUri ? (
                  <Image source={{ uri: displayImageUri }} style={styles.profileImage} />
                ) : (
                  <Ionicons name="person" size={60} color={secondaryTextColor} />
                )}
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.imageHint, { color: secondaryTextColor }]}>
                Tap to change profile picture
              </Text>
              {uploading && (
                <ActivityIndicator size="small" color={Colors.primary} style={styles.uploadingIndicator} />
              )}
            </View>

            {/* Nickname */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: secondaryTextColor }]}>Nickname</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: cardBgColor,
                    color: textColor,
                    borderColor: borderColor,
                  }
                ]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Enter your nickname"
                placeholderTextColor={secondaryTextColor}
                editable={!loading && !uploading}
                maxLength={20}
              />
              <Text style={[styles.charCount, { color: secondaryTextColor }]}>
                {nickname.length}/20
              </Text>
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: secondaryTextColor }]}>Email</Text>
              <View style={[styles.input, styles.readOnlyInput, { backgroundColor: cardBgColor, borderColor }]}>
                <Text style={[styles.readOnlyText, { color: secondaryTextColor }]}>
                  {user?.email || 'N/A'}
                </Text>
              </View>
              <Text style={[styles.hint, { color: secondaryTextColor }]}>
                Email cannot be changed
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  imageHint: {
    marginTop: 8,
    fontSize: 12,
  },
  uploadingIndicator: {
    marginTop: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  readOnlyInput: {
    opacity: 0.6,
  },
  readOnlyText: {
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
});

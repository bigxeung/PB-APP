import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface TopNavigationProps {
  onSearchPress?: () => void;
  showSearch?: boolean;
  showProfile?: boolean;
}

export default function TopNavigation({ onSearchPress, showSearch = true, showProfile = true }: TopNavigationProps) {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigation = useNavigation();
  const [showSettings, setShowSettings] = useState(false);

  const handleProfilePress = () => {
    // @ts-ignore
    navigation.navigate('Profile');
  };

  const handleSettingsPress = () => {
    setShowSettings(!showSettings);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setShowSettings(false);
  };

  const bgColor = isDark ? '#1A1A1D' : '#FFFFFF';
  const textColor = isDark ? '#fff' : '#000';
  const secondaryBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <View style={[
      styles.container,
      { backgroundColor: bgColor },
      !showProfile && { justifyContent: 'flex-end' }
    ]}>
      {showProfile && (
        <TouchableOpacity
          style={styles.profileSection}
          onPress={handleProfilePress}
        >
          {user?.profileImageUrl ? (
            <Image
              source={{ uri: user.profileImageUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={20} color="#828282" />
            </View>
          )}
          <Text style={[styles.nickname, { color: textColor }]}>
            {user?.nickname || 'Guest'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        {showSearch && onSearchPress && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: secondaryBgColor }]}
            onPress={onSearchPress}
          >
            <Ionicons name="search" size={24} color={textColor} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: secondaryBgColor }]}
          onPress={handleSettingsPress}
        >
          <Ionicons name="settings-outline" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Settings Dropdown */}
      {showSettings && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowSettings(false)}
          />
          <View style={[styles.dropdown, { backgroundColor: bgColor, borderColor }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleThemeToggle}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={textColor}
              />
              <Text style={[styles.dropdownText, { color: textColor }]}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 180,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor,
}: EmptyStateProps) {
  const { isDark } = useTheme();

  const textColor = isDark ? Colors.textSecondary : '#666';
  const mutedTextColor = isDark ? Colors.textMuted : '#999';
  const defaultIconColor = iconColor || mutedTextColor;

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={defaultIconColor} />
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: mutedTextColor }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
});

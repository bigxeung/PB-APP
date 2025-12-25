import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoraModel } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../../constants/theme';

interface ModelCardProps {
  model: LoraModel;
  onPress: () => void;
}

export default function ModelCard({ model, onPress }: ModelCardProps) {
  const { isDark } = useTheme();
  const cardBgColor = isDark ? '#28282B' : '#F5F5F5';
  const imageBgColor = isDark ? '#3A3A3D' : '#E0E0E0';
  const textColor = isDark ? '#fff' : '#000';
  const secondaryTextColor = isDark ? '#828282' : '#666';
  const statTextColor = isDark ? '#BDBDBD' : '#999';

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: cardBgColor }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.imageContainer, { backgroundColor: imageBgColor }]}>
        {model.thumbnailUrl ? (
          <Image
            source={{ uri: model.thumbnailUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={40} color={secondaryTextColor} />
          </View>
        )}
        {model.isLiked && (
          <View style={styles.likedBadge}>
            <Ionicons name="heart" size={16} color="#EF4444" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={[styles.author, { color: secondaryTextColor }]} numberOfLines={1}>
          {model.userNickname || 'Anonymous'}
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={14} color={statTextColor} />
            <Text style={[styles.statText, { color: statTextColor }]}>{formatNumber(model.likeCount)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={14} color={statTextColor} />
            <Text style={[styles.statText, { color: statTextColor }]}>{formatNumber(model.viewCount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoraModel } from '../types';

interface ModelCardProps {
  model: LoraModel;
  onPress: () => void;
}

export default function ModelCard({ model, onPress }: ModelCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {model.thumbnailUrl ? (
          <Image
            source={{ uri: model.thumbnailUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={40} color="#828282" />
          </View>
        )}
        {model.isLiked && (
          <View style={styles.likedBadge}>
            <Ionicons name="heart" size={16} color="#EF4444" />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {model.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {model.userNickname || 'Anonymous'}
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={14} color="#BDBDBD" />
            <Text style={styles.statText}>{formatNumber(model.likeCount)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={14} color="#BDBDBD" />
            <Text style={styles.statText}>{formatNumber(model.viewCount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#28282B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 3 / 4,
    backgroundColor: '#3A3A3D',
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
    color: '#fff',
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: '#828282',
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
    color: '#BDBDBD',
  },
});

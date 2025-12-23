import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function ModelCardSkeleton() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.imageContainer, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.authorSkeleton, { opacity }]} />
        <View style={styles.stats}>
          <Animated.View style={[styles.statSkeleton, { opacity }]} />
          <Animated.View style={[styles.statSkeleton, { opacity }]} />
        </View>
      </View>
    </View>
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
    aspectRatio: 3 / 4,
    backgroundColor: '#3A3A3D',
  },
  content: {
    padding: 12,
  },
  titleSkeleton: {
    height: 14,
    backgroundColor: '#3A3A3D',
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  authorSkeleton: {
    height: 12,
    backgroundColor: '#3A3A3D',
    borderRadius: 4,
    marginBottom: 12,
    width: '50%',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statSkeleton: {
    height: 12,
    width: 40,
    backgroundColor: '#3A3A3D',
    borderRadius: 4,
  },
});

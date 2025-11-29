import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface SectionCardSkeletonProps {
  count: number;
}

export const SectionCardSkeleton: React.FC<SectionCardSkeletonProps> = ({ count }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[styles.skeletonCard, { opacity }]}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  skeletonCard: {
    height: 96,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    marginBottom: 12,
  },
});

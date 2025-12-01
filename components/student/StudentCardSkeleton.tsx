import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Colors from '../../constants/Colors';

export const StudentCardSkeleton: React.FC = () => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={styles.card}>
      {/* Avatar Skeleton */}
      <Animated.View style={[styles.avatar, { opacity }]} />

      {/* Info Skeleton */}
      <View style={styles.info}>
        <Animated.View style={[styles.nameLine, { opacity }]} />
        <Animated.View style={[styles.detailLine, { opacity }]} />
        <Animated.View style={[styles.statusBadge, { opacity }]} />
      </View>

      {/* Actions Skeleton */}
      <View style={styles.actions}>
        <Animated.View style={[styles.actionBtn, { opacity }]} />
        <Animated.View style={[styles.actionBtn, { opacity }]} />
      </View>
    </View>
  );
};

interface StudentCardSkeletonListProps {
  count?: number;
}

export const StudentCardSkeletonList: React.FC<StudentCardSkeletonListProps> = ({ 
  count = 6 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <StudentCardSkeleton key={`skeleton-${index}`} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  info: {
    flex: 1,
    gap: 8,
  },
  nameLine: {
    height: 16,
    width: '70%',
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  detailLine: {
    height: 14,
    width: '50%',
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  statusBadge: {
    height: 19,
    width: 70,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
});

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

// Skeleton para StatsCards
export const StatsCardsSkeleton: React.FC = () => {
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
    <View style={styles.statsContainer}>
      <Animated.View style={[styles.statsCard, { opacity }]} />
    </View>
  );
};

// Skeleton para SearchBar
export const SearchBarSkeleton: React.FC = () => {
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
    <View style={styles.searchContainer}>
      <Animated.View style={[styles.searchBar, { opacity }]} />
    </View>
  );
};

// Skeleton para Pagination - Replica la estructura real
export const PaginationSkeleton: React.FC = () => {
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
    <View style={styles.paginationContainer}>
      {/* Flecha izquierda */}
      <Animated.View style={[styles.paginationArrow, { opacity }]} />

      {/* Botones de páginas (6 como en tu diseño) */}
      <View style={styles.paginationPages}>
        <Animated.View style={[styles.paginationButton, { opacity }]} />
        <Animated.View style={[styles.paginationButton, { opacity }]} />
        <Animated.View style={[styles.paginationButton, { opacity }]} />
        <Animated.View style={[styles.paginationButton, { opacity }]} />
        <Animated.View style={[styles.paginationButton, { opacity }]} />
      </View>

      {/* Flecha derecha */}
      <Animated.View style={[styles.paginationArrow, { opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    marginBottom: 20,
  },
  statsCard: {
    height: 90,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchBar: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  paginationArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
  },
  paginationPages: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
  },
});

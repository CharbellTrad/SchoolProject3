import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

// Skeleton para SectionStatsCard
export const SectionStatsCardSkeleton: React.FC = () => {
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

// Skeleton para SectionFilters
export const SectionFiltersSkeleton: React.FC = () => {
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
    <View style={styles.filtersContainer}>
      <Animated.View style={[styles.filterChip, { opacity }]} />
      <Animated.View style={[styles.filterChip, { opacity }]} />
      <Animated.View style={[styles.filterChip, { opacity }]} />
    </View>
  );
};

// Skeleton para SectionSearchBar (ya existe como SearchBarSkeleton, pero aquí está por completitud)
export const SectionSearchBarSkeleton: React.FC = () => {
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

// Skeleton para SectionCard individual
export const SectionCardSkeleton: React.FC<{ count: number }> = ({ count }) => {
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
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Indicador de tipo (icono) */}
            <Animated.View style={[styles.typeIndicator, { opacity }]} />

            {/* Contenido */}
            <View style={styles.content}>
              {/* Nombre */}
              <Animated.View style={[styles.nameSkeleton, { opacity }]} />
              {/* Badge de tipo */}
              <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
            </View>

            {/* Chevron */}
            <Animated.View style={[styles.chevronSkeleton, { opacity }]} />
          </View>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  // Stats Card
  statsContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  statsCard: {
    height: 90,
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
  },
  
  // Filters
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: Platform.OS === 'android' ? 2 : 8,
    marginBottom: 10,
  },
  filterChip: {
    width: Platform.OS === 'android' ? 112 : 123.5,
    height: Platform.OS === 'android' ? 42 : 35,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  
  // Search Bar
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  
  // Section Card
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      }
    }),
  },
  typeIndicator: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    marginRight: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  nameSkeleton: {
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    marginBottom: 8,
    width: '70%',
  },
  badgeSkeleton: {
    height: 24,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    width: 90,
  },
  chevronSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginLeft: 8,
  },
});
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

// ========== SKELETON: STATS CARD ==========
export const SubjectStatsCardSkeleton: React.FC = () => {
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

// ========== SKELETON: SEARCH BAR ==========
export const SubjectSearchBarSkeleton: React.FC = () => {
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

// ========== SKELETON: SUBJECT CARD ==========
export const SubjectCardSkeleton: React.FC<{ count: number }> = ({ count }) => {
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
            {/* Icono */}
            <Animated.View style={[styles.iconContainer, { opacity }]} />

            {/* Contenido */}
            <View style={styles.content}>
              {/* Nombre */}
              <Animated.View style={[styles.nameSkeleton, { opacity }]} />
              
              {/* Badges */}
              <View style={styles.badgesContainer}>
                <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
                <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
              </View>
            </View>

            {/* Chevron */}
            <Animated.View style={[styles.chevronSkeleton, { opacity }]} />
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

  // Search Bar
  searchContainer: {
    marginBottom: 8,
  },
  searchBar: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },

  // Subject Card
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  iconContainer: {
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
    width: '80%',
  },
  badgesContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  badgeSkeleton: {
    width: 90,
    height: 24,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  chevronSkeleton: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginLeft: 8,
  },
});
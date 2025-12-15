import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Colors from '../../constants/Colors';

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

// Skeleton para Pagination - Replica la estructura real con fondo blanco y borde
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
    outputRange: [0.4, 0.7, 0.4],
  });

  return (
    <View style={styles.paginationContainer}>
      {/* Flecha izquierda */}
      <View style={styles.paginationArrow}>
        <Animated.View style={[styles.arrowInner, { opacity }]} />
      </View>

      {/* Botones de páginas */}
      <View style={styles.paginationPages}>
        <View style={styles.paginationButton}>
          <Animated.View style={[styles.buttonInner, { opacity }]} />
        </View>
        <View style={styles.paginationButton}>
          <Animated.View style={[styles.buttonInner, { opacity }]} />
        </View>
        <View style={styles.paginationButton}>
          <Animated.View style={[styles.buttonInner, { opacity }]} />
        </View>
        <View style={styles.paginationButton}>
          <Animated.View style={[styles.buttonInner, { opacity }]} />
        </View>
        <View style={styles.paginationButton}>
          <Animated.View style={[styles.buttonInner, { opacity }]} />
        </View>
      </View>

      {/* Flecha derecha */}
      <View style={styles.paginationArrow}>
        <Animated.View style={[styles.arrowInner, { opacity }]} />
      </View>
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
    backgroundColor: '#e2e8f0',
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchBar: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paginationArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
  },
  arrowInner: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  paginationPages: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
    flexGrow: 1,
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
  },
  buttonInner: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
});

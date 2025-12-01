import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Colors from '../../../../constants/Colors';

export const EditParentsTabSkeleton: React.FC = () => {
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

  const ParentCardSkeleton: React.FC = () => (
    <View style={styles.parentCard}>
      {/* Avatar */}
      <Animated.View style={[styles.avatarSkeleton, { opacity }]} />
      
      {/* Info */}
      <View style={styles.parentInfo}>
        <Animated.View style={[styles.nameSkeleton, { opacity }]} />
        <Animated.View style={[styles.detailSkeleton, { opacity, marginTop: 3 }]} />
        <Animated.View style={[styles.detailSkeleton, { opacity, marginTop: 2, width: '45%' }]} />
        
        {/* Badge */}
        <View style={styles.badgeContainer}>
          <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
        </View>
      </View>
      
      {/* Actions */}
      <View style={styles.parentActions}>
        <Animated.View style={[styles.actionButtonSkeleton, { opacity }]} />
        <Animated.View style={[styles.actionButtonSkeleton, { opacity }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>      
      {/* Parent Cards */}
      <ParentCardSkeleton />
      <ParentCardSkeleton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  parentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  
  avatarSkeleton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  
  parentInfo: {
    flex: 1,
    minWidth: 0,
  },
  
  nameSkeleton: {
    width: '70%',
    height: 15.5,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  
  detailSkeleton: {
    width: '55%',
    height: 13,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  
  badgeContainer: {
    marginTop: 12,
  },
  
  badgeSkeleton: {
    width: 90,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  
  parentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButtonSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
});
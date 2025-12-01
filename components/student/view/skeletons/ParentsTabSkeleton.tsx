import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { listStyles } from '../../../../constants/Styles';
import { InfoSection } from '../../../list';

export const ParentsTabSkeleton: React.FC = () => {
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
    <View style={listStyles.card}>
      <View style={listStyles.cardMain}>
        {/* Avatar skeleton - usa listStyles.avatarContainer */}
        <View style={listStyles.avatarContainer}>
          <Animated.View style={[styles.avatarSkeleton, { opacity }]} />
        </View>

        {/* Info Container - usa listStyles.cardInfo */}
        <View style={listStyles.cardInfo}>
          {/* Nombre skeleton - mismo estilo que cardName */}
          <Animated.View style={[styles.nameSkeleton, { opacity }]} />
          
          {/* Detalles skeleton - mismo espaciado que cardDetail */}
          <Animated.View style={[styles.detailSkeleton, { opacity, marginTop: 4 }]} />
          <Animated.View style={[styles.detailSkeleton, { opacity, marginTop: 4 }]} />
        </View>

        {/* Chevron skeleton (opcional: puedes usar el ícono real o un skeleton) */}
        <Animated.View style={[styles.chevronSkeleton, { opacity }]} />
      </View>
    </View>
  );

  return (
    <InfoSection title="Representantes del Estudiante">
      {/* Parent Cards */}
      <ParentCardSkeleton />
      <ParentCardSkeleton />
    </InfoSection>
  );
};

const styles = StyleSheet.create({
  avatarSkeleton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  
  nameSkeleton: {
    width: '70%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  
  detailSkeleton: {
    width: '50%',
    height: 17,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  
  chevronSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
});
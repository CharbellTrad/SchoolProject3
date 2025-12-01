import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Colors from '../../../../constants/Colors';
import { listStyles } from '../../../../constants/Styles';
import { InfoSection } from '../../../list';

export const InscriptionsTabSkeleton: React.FC = () => {
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

  const InscriptionCardSkeleton: React.FC<{ borderColor: string }> = ({ borderColor }) => (
    <View style={[listStyles.card, styles.inscriptionCard, { borderLeftColor: borderColor }]}>
      <View style={listStyles.cardMain}>
        {/* Inscription Header */}
        <View style={styles.inscriptionHeader}>
          {/* Badge skeleton (opcional, para la primera tarjeta) */}
          <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
          
          {/* Nombre de inscripción */}
          <Animated.View style={[styles.nameSkeleton, { opacity }]} />
          
          {/* Detalles (año • sección • tipo) */}
          <Animated.View style={[styles.detailSkeleton, { opacity, marginTop: 4 }]} />
          
          {/* Fecha */}
          <Animated.View style={[styles.dateSkeleton, { opacity, marginTop: 2 }]} />
        </View>

        {/* Inscription Actions */}
        <View style={styles.inscriptionActions}>
          {/* Status badge */}
          <Animated.View style={[styles.statusBadgeSkeleton, { opacity }]} />
          
          {/* Chevron */}
          <Animated.View style={[styles.chevronSkeleton, { opacity }]} />
        </View>
      </View>
    </View>
  );

  return (
    <InfoSection title="Inscripciones del Estudiante">
      {/* Primera inscripción (activa - verde) */}
      <InscriptionCardSkeleton borderColor={Colors.gray[500]} />
      
      {/* Segunda inscripción (borrador - amarillo) */}
      <InscriptionCardSkeleton borderColor={Colors.gray[500]} />
    </InfoSection>
  );
};

const styles = StyleSheet.create({
  inscriptionCard: {
    borderLeftWidth: 4,
  },
  
  inscriptionHeader: {
    flex: 1,
    marginRight: 12,
  },
  
  inscriptionActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  
  badgeSkeleton: {
    width: 60,
    height: 18,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    marginBottom: 6,
  },
  
  nameSkeleton: {
    width: '85%',
    height: 18,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  
  detailSkeleton: {
    width: '65%',
    height: 14,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  
  dateSkeleton: {
    width: '55%',
    height: 14,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  
  statusBadgeSkeleton: {
    width: 70,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  
  chevronSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
});
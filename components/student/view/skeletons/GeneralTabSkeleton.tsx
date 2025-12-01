import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Colors from '../../../../constants/Colors';


export const GeneralTabSkeleton: React.FC = () => {
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

  // Skeleton de una sección (InfoSection)
  const SectionSkeleton: React.FC<{ rowCount: number }> = ({ rowCount }) => (
    <View style={styles.sectionContainer}>
      {/* Título de la sección */}
      <Animated.View style={[styles.sectionTitle, { opacity }]} />
      
      {/* Contenido de la sección */}
      <View style={styles.sectionContent}>
        {Array.from({ length: rowCount }).map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.infoRow,
              index < rowCount - 1 && styles.infoRowBorder
            ]}
          >
            {/* Icono skeleton */}
            <View style={styles.iconBox}>
              <Animated.View style={[styles.iconSkeleton, { opacity }]} />
            </View>
            
            {/* Texto skeleton */}
            <View style={styles.textContainer}>
              <Animated.View style={[styles.labelSkeleton, { opacity }]} />
              <Animated.View style={[styles.valueSkeleton, { opacity }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <>
      {/* Imagen Skeleton */}
      <View style={styles.imageContainer}>
        <Animated.View style={[styles.imageSkeleton, { opacity }]} />
      </View>

      {/* Información Personal (6 filas) */}
      <SectionSkeleton rowCount={6} />

      {/* Contacto (4 filas) */}
      <SectionSkeleton rowCount={4} />

      {/* Dirección (1 fila) */}
      <SectionSkeleton rowCount={1} />

      {/* Información Adicional (1 fila) */}
      <SectionSkeleton rowCount={1} />
    </>
  );
};

const styles = StyleSheet.create({
  // Imagen
  imageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  imageSkeleton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  
  // InfoSection Container (replica styles de InfoSection.tsx)
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }
    }),
  },
  
  // Título de sección
  sectionTitle: {
    width: 150,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginBottom: 10,
  },
  
  // Contenido de sección
  sectionContent: {
    marginLeft: 2,
  },
  
  // InfoRow (replica styles de InfoRow.tsx)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  
  // Icono Box (replica styles de InfoRow.tsx)
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  
  iconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  
  // Text Container (replica styles de InfoRow.tsx)
  textContainer: {
    flex: 1,
  },
  
  labelSkeleton: {
    width: 100,
    height: 13,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    marginBottom: 4,
  },
  
  valueSkeleton: {
    width: '65%',
    height: 15,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
});
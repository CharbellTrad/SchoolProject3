import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Colors from '../../../../constants/Colors';

export const EditGeneralTabSkeleton: React.FC = () => {
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

  // Skeleton de una sección (similar a las del formulario)
  const SectionSkeleton: React.FC<{ title?: boolean; fieldCount: number }> = ({ 
    title = true, 
    fieldCount 
  }) => (
    <View style={styles.section}>
      {title && (
        <View style={styles.sectionHeader}>
          <Animated.View style={[styles.iconBox, { opacity }]} />
          <Animated.View style={[styles.sectionTitle, { opacity }]} />
        </View>
      )}
      
      <View style={styles.sectionContent}>
        {Array.from({ length: fieldCount }).map((_, index) => (
          <View key={index} style={styles.fieldContainer}>
            {/* Label skeleton */}
            <Animated.View style={[styles.labelSkeleton, { opacity }]} />
            
            {/* Input skeleton */}
            <View style={styles.inputContainer}>
              <Animated.View style={[styles.iconSkeleton, { opacity }]} />
              <Animated.View style={[styles.inputSkeleton, { opacity }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Foto del Estudiante */}
      <View style={styles.photoSection}>
        <View style={styles.photoHeader}>
          <Animated.View style={[styles.iconBox, { opacity }]} />
          <Animated.View style={[styles.photoTitle, { opacity }]} />
        </View>
        <View style={styles.photoContent}>
          <Animated.View style={[styles.photoCircle, { opacity }]} />
          <View style={styles.photoButtons}>
            <Animated.View style={[styles.photoButton, { opacity }]} />
          </View>
        </View>
      </View>

      {/* Información Personal (6 campos) */}
      <SectionSkeleton fieldCount={6} />

      {/* Contacto (4 campos) */}
      <SectionSkeleton fieldCount={4} />

      {/* Dirección (2 campos) */}
      <SectionSkeleton fieldCount={2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  
  // Photo Section
  photoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }
    }),
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  photoTitle: {
    width: 140,
    height: 15,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  photoContent: {
    padding: 5,
    alignItems: 'center',
    paddingVertical: 5,
  },
  photoCircle: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    marginBottom: 15,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    width: 280,
    height: 40,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  
  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#d1d5db',
  },
  sectionTitle: {
    width: 150,
    height: 15,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  sectionContent: {
    padding: 5,
    gap: 5,
  },
  
  // Field
  fieldContainer: {
    marginBottom: 18,
  },
  labelSkeleton: {
    width: 120,
    height: 15,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    marginBottom: 10,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 56,
    paddingHorizontal: 4,
  },
  iconSkeleton: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#d1d5db',
    marginLeft: 11,
    marginRight: 11,
  },
  inputSkeleton: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginRight: 16,
  },
});
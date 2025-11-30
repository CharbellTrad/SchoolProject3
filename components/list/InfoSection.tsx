import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

export const InfoSection: React.FC<InfoSectionProps> = ({
  title,
  children,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  content: {
    marginLeft: 2,
  },
});

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';

interface SubjectStatsCardProps {
  total: number;
}

export const SubjectStatsCard: React.FC<SubjectStatsCardProps> = ({ total }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.number}>{total}</Text>
          <Text style={styles.label}>Total de materias</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
    }),
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  number: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
});
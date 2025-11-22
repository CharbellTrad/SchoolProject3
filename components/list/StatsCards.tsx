import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';

interface StatsCardsProps {
  total: number;
  active: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ total, active }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.number}>{total}</Text>
        <Text style={styles.label}>Total</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.number}>{active}</Text>
        <Text style={styles.label}>Activos</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  number: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

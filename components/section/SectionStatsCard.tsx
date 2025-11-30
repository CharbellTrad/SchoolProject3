import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

interface SectionStatsCardProps {
  total: number;
  isSelected?: boolean;
  onPress?: () => void;
}

export const SectionStatsCard: React.FC<SectionStatsCardProps> = ({
  total,
  isSelected = false,
  onPress,
}) => {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <View style={styles.container}>
      <Component
        style={[
          styles.card,
          isSelected && styles.cardSelected,
        ]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.content}>
          <Text style={[
            styles.number,
            isSelected && styles.numberSelected,
          ]}>
            {total}
          </Text>
          <Text style={[
            styles.label,
            isSelected && styles.labelSelected,
          ]}>
            Total de registros
          </Text>
        </View>
      </Component>
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
      }
    }),
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      }
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
  numberSelected: {
    color: Colors.primary,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

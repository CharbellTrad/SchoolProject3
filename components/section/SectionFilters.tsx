import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import type { SectionType } from '../../services-odoo/sectionService';

interface SectionFiltersProps {
  countByType: {
    pre: number;
    primary: number;
    secundary: number;
  };
  selectedFilter: SectionType | 'all';
  onFilterChange: (filter: SectionType | 'all') => void;
}

export const SectionFilters: React.FC<SectionFiltersProps> = ({
  countByType,
  selectedFilter,
  onFilterChange,
}) => {
  return (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'pre' && styles.filterChipSelected,
        ]}
        onPress={() => onFilterChange('pre')}
        activeOpacity={0.7}
      >
        <View style={[styles.filterDot, { backgroundColor: Colors.levelPre }]} />
        <Text style={[
          styles.filterChipText,
          selectedFilter === 'pre' && styles.filterChipTextSelected,
        ]}>
          Preescolar ({countByType.pre})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'primary' && styles.filterChipSelected,
        ]}
        onPress={() => onFilterChange('primary')}
        activeOpacity={0.7}
      >
        <View style={[styles.filterDot, { backgroundColor: Colors.levelPrimary }]} />
        <Text style={[
          styles.filterChipText,
          selectedFilter === 'primary' && styles.filterChipTextSelected,
        ]}>
          Primaria ({countByType.primary})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterChip,
          selectedFilter === 'secundary' && styles.filterChipSelected,
        ]}
        onPress={() => onFilterChange('secundary')}
        activeOpacity={0.7}
      >
        <View style={[styles.filterDot, { backgroundColor: Colors.levelSecundary }]} />
        <Text style={[
          styles.filterChipText,
          selectedFilter === 'secundary' && styles.filterChipTextSelected,
        ]}>
          Media ({countByType.secundary})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: Platform.OS === 'android' ? 2 : 8,
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: Platform.OS === 'android' ? 14 : 17.5,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      }
    }),
  },
  filterChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      }
    }),
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import Colors from '../../constants/Colors';

interface SelectionItem {
  id: number;
  name: string;
}

interface SelectionFieldProps {
  label: string;
  items: SelectionItem[];
  selectedIds: number[];
  onToggleItem: (id: number) => void;
  required?: boolean;
  error?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const SelectionField: React.FC<SelectionFieldProps> = ({
  label,
  items,
  selectedIds,
  onToggleItem,
  required = false,
  error,
  isLoading = false,
  emptyMessage = 'No hay elementos disponibles',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filtrar items seleccionados
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  return (
    <View style={styles.container}>
      {/* Header con label y toggle */}
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
          {selectedIds.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{selectedIds.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.expandToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.expandToggleText}>
            {isExpanded ? 'Ocultar' : 'Seleccionar'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Chips de seleccionados */}
      {selectedItems.length > 0 && (
        <View style={styles.chipsWrapper}>
          <Text style={styles.chipsTitle}>Seleccionados:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContent}
          >
            {selectedItems.map((item) => (
              <View key={item.id} style={styles.chip}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.chipText} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Mensaje cuando no hay selección */}
      {selectedItems.length === 0 && !error && (
        <View style={styles.emptyState}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={Colors.textTertiary}
          />
          <Text style={styles.emptyStateText}>
            Ningún elemento seleccionado
          </Text>
        </View>
      )}

      {/* Lista expandible */}
      {isExpanded && (
        <View style={styles.listContainer}>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          ) : (
            items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.listItem,
                    isSelected && styles.listItemSelected,
                  ]}
                  onPress={() => onToggleItem(item.id)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={isSelected ? Colors.primary : Colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.listItemText,
                      isSelected && styles.listItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  required: {
    color: Colors.error,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary + '12',
    borderRadius: 8,
  },
  expandToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
    flex: 1,
  },
  chipsWrapper: {
    gap: 8,
  },
  chipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingLeft: 4,
  },
  chipsScrollContent: {
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary + '12',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      }
    }),
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    maxWidth: 180,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  listContainer: {
    gap: 8,
    paddingTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  listItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  listItemTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
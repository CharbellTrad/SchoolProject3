import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

interface SelectionItem {
  id: number;
  name: string;
}

interface SelectionChipsProps {
  label: string;
  items: SelectionItem[];
  selectedIds: number[];
  onOpenModal: () => void;
  required?: boolean;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function SelectionChips({
  label,
  items,
  selectedIds,
  onOpenModal,
  required = false,
  error,
  icon = 'add-circle-outline',
}: SelectionChipsProps) {
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  return (
    <View style={styles.container}>
      {/* Label con badge */}
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

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Botón para abrir modal */}
      <TouchableOpacity
        style={[styles.addButton, error && styles.addButtonError]}
        onPress={onOpenModal}
        activeOpacity={0.7}
      >
        <Ionicons name={icon} size={22} color={Colors.primary} />
        <Text style={styles.addButtonText}>
          {selectedIds.length === 0 
            ? `Seleccionar ${label.toLowerCase()}` 
            : 'Modificar selección'
          }
        </Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
      </TouchableOpacity>

      {/* Chips de elementos seleccionados */}
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
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                <Text style={styles.chipText} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Mensaje cuando no hay selección */}
      {selectedIds.length === 0 && !error && (
        <View style={styles.emptyState}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textTertiary} />
          <Text style={styles.emptyStateText}>
            Ningún elemento seleccionado
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      }
    }),
  },
  addButtonError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '05',
  },
  addButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
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
});
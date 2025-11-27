import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { Parent } from '../../services-odoo/personService';

interface ParentCardProps {
  parent: Partial<Parent> & { id?: number };
  index: number;
  onEdit?: () => void;
  onRemove: () => void;
}

export const ParentCard: React.FC<ParentCardProps> = ({
  parent,
  index,
  onEdit,
  onRemove,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarIcon}>
          <Ionicons name="person" size={30} color={Colors.primary} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{parent.name}</Text>
        <Text style={styles.idRow} numberOfLines={1}>
          {parent.nationality}{parent.vat ? `-${parent.vat}` : ''} • {parent.phone}
        </Text>
      </View>
      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarSection: {
    marginRight: 16,
  },
  avatarIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  idRow: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
});

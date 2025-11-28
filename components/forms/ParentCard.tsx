import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Styles';
import { Parent } from '../../services-odoo/personService';
import { formatPhone } from '../../utils/formatHelpers';

interface ParentCardProps {
  parent: Partial<Parent> & { id?: number };
  index: number;
  onEdit?: () => void;
  onRemove: () => void;
}

export const ParentCard: React.FC<ParentCardProps> = ({
  parent,
  onEdit,
  onRemove,
}) => {
  return (
    <View style={GlobalStyles.cardSmall}>
      <View style={styles.header}>
        <View style={[GlobalStyles.avatar, GlobalStyles.avatarPrimary]}>
          {parent.image_1920 ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${parent.image_1920}` }}
              style={styles.avatarImage}
              resizeMode='cover'
            />
          ) : (
            <Ionicons name="person" size={32} color={Colors.primary} />
          )}
        </View>
        
        <View style={styles.info}>
          <Text style={styles.name}>{parent.name}</Text>
          <Text style={styles.detail}>
            {parent.nationality}-{parent.vat} • {formatPhone(parent.phone)}
          </Text>
          
          {parent.ci_document && (
            <View style={styles.badge}>
              <Ionicons name="document-text" size={12} color={Colors.success} />
              <Text style={styles.badgeText}>Cédula adjunta</Text>
            </View>
          )}
          
          {parent.id && (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.info} />
              <Text style={[styles.badgeText, { color: Colors.info }]}>
                Representante existente
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.actions}>
          {!parent.id && onEdit && (
            <TouchableOpacity onPress={onEdit}>
              <Ionicons name="create" size={24} color={Colors.secondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRemove}>
            <Ionicons name="trash" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  detail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.success,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});

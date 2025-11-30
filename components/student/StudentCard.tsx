import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { Student } from '../../services-odoo/personService';

interface StudentCardProps {
  student: Student;
  onView: () => void;
  onEdit: () => void;
  isOfflineMode?: boolean;
  index?: number; // ← NUEVO: para el delay escalonado
}

export const StudentCard: React.FC<StudentCardProps> = React.memo(
  ({ student, onView, onEdit, isOfflineMode = false, index = 0 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50, // 50ms de delay entre cada card
        useNativeDriver: true,
      }).start();
    }, [fadeAnim, index]);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.card}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {student.image_1920 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${student.image_1920}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color={Colors.primary} />
              </View>
            )}
            {student.is_active && <View style={styles.activeBadge} />}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {student.name}
            </Text>
            <Text style={styles.detail} numberOfLines={1}>
              {student.nationality}-{student.vat}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  student.is_active
                    ? styles.statusActive
                    : styles.statusInactive,
                ]}
              >
                <Ionicons
                  name={student.is_active ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={student.is_active ? Colors.success : Colors.error}
                />
                <Text
                  style={[
                    styles.statusText,
                    student.is_active
                      ? styles.statusTextActive
                      : styles.statusTextInactive,
                  ]}
                >
                  {student.is_active ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
              {isOfflineMode && (
                <View style={styles.offlineBadge}>
                  <Ionicons name="cloud-offline" size={12} color={Colors.warning} />
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.viewBtn, isOfflineMode && styles.btnDisabled]}
              onPress={onView}
              activeOpacity={0.7}
              disabled={isOfflineMode}
            >
              <Ionicons 
                name="eye-outline" 
                size={18} 
                color={isOfflineMode ? Colors.textTertiary : Colors.primary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editBtn, isOfflineMode && styles.btnDisabled]}
              onPress={onEdit}
              activeOpacity={0.7}
              disabled={isOfflineMode}
            >
              <Ionicons 
                name="create-outline" 
                size={18} 
                color={isOfflineMode ? Colors.textTertiary : Colors.secondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.student.id === nextProps.student.id &&
      prevProps.student.name === nextProps.student.name &&
      prevProps.student.is_active === nextProps.student.is_active &&
      prevProps.student.vat === nextProps.student.vat &&
      prevProps.student.image_1920 === nextProps.student.image_1920 &&
      prevProps.isOfflineMode === nextProps.isOfflineMode
    );
  }
);

StudentCard.displayName = 'StudentCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: '#fff',
  },
  info: {
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
  detail: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusActive: {
    backgroundColor: Colors.success + '15',
  },
  statusInactive: {
    backgroundColor: Colors.error + '15',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: Colors.success,
  },
  statusTextInactive: {
    color: Colors.error,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.warning + '15',
    gap: 4,
  },
  offlineText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 8,
  },
  viewBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.secondary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: Colors.gray[100],
    opacity: 0.5,
  },
});

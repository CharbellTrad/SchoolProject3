/**
 * Tarjeta individual de dispositivo biométrico
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Colors from '../../constants/Colors';
import type { BiometricDeviceBackend } from '../../services-odoo/biometricService';
import { getBiometricIcon } from '../../utils/biometricHelpers';

// Habilitar animaciones de layout en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BiometricDeviceCardProps {
  device: BiometricDeviceBackend;
  onRevoke?: (device: BiometricDeviceBackend) => void;
  onViewDetails?: (device: BiometricDeviceBackend) => void;
  isLoading?: boolean;
}

export const BiometricDeviceCard: React.FC<BiometricDeviceCardProps> = ({
  device,
  onRevoke,
  onViewDetails,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const getStatusColor = (): string => {
    if (device.state === 'revoked') return Colors.error;
    if (device.hasActiveSession) return Colors.success;
    if (device.isStale) return Colors.warning;
    return Colors.textSecondary;
  };

  const getStatusText = (): string => {
    if (device.state === 'revoked') return 'Revocado';
    if (device.hasActiveSession) return 'Sesión activa';
    if (device.isStale) return 'Inactivo (>30 días)';
    return 'Inactivo';
  };

  const getPlatformIcon = (): string => {
    switch (device.platform) {
      case 'ios': return 'logo-apple';
      case 'android': return 'logo-android';
      default: return 'desktop-outline';
    }
  };

  const formatLastUsed = (): string => {
    if (!device.lastUsedAt) return 'Nunca usado';
    try {
      const date = new Date(device.lastUsedAt);
      return date.toLocaleDateString('es-VE', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Desconocido'; }
  };
  
  const formatEnrolledDate = (): string => {
    if (!device.enrolledAt) return 'Desconocido';
    try {
      const date = new Date(device.enrolledAt);
      return date.toLocaleString('es-VE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Desconocido';
    }
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();
  const isCurrent = device.isCurrentDevice;

  return (
    <View style={[
      styles.card,
      isCurrent && styles.currentCard,
      device.state === 'revoked' && styles.revokedCard
    ]}>
      {/* Indicador de Dispositivo Actual */}
      {isCurrent && (
        <View style={styles.currentBadgeTop}>
          <Text style={styles.currentBadgeText}>Este Dispositivo</Text>
        </View>
      )}

      {/* Header Principal */}
      <TouchableOpacity
        style={styles.mainContent}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: statusColor + '15' }]}>
            <Ionicons name={getPlatformIcon() as any} size={28} color={statusColor} />
            {device.hasActiveSession && (
              <View style={[styles.onlineDot, { backgroundColor: Colors.success }]} />
            )}
          </View>

          <View style={styles.titleColumn}>
            <Text style={styles.deviceName} numberOfLines={1}>{device.deviceName}</Text>
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.lastUsedText}>{formatLastUsed()}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={toggleExpand} style={styles.chevronButton}>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Info Grid (Siempre visible - Resumido) */}
        {!expanded && (
          <View style={styles.miniGrid}>
            <View style={styles.miniItem}>
              <Ionicons name={getBiometricIcon(device.biometricType)} size={14} color={Colors.textSecondary} />
              <Text style={styles.miniText}>{device.biometricType}</Text>
            </View>
            <View style={styles.miniItem}>
              <Ionicons name="phone-portrait-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.miniText}>{device.modelName}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Detalles Expandidos */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Detalles del Dispositivo</Text>
          <View style={styles.grid}>
            <InfoItem label="Modelo" value={device.modelName} icon="hardware-chip-outline" />
            <InfoItem label="Marca" value={device.brand} icon="pricetag-outline" />
            <InfoItem label="SO" value={`${device.platform.toUpperCase()} ${device.osVersion}`} icon="layers-outline" />
            <InfoItem label="Biometría" value={device.biometricType} icon="finger-print-outline" />
            <InfoItem label="Inscrito" value={formatEnrolledDate()} icon="calendar-outline" />
            <InfoItem label="Auths" value={device.authCount.toString()} icon="shield-checkmark-outline" />
          </View>

          {(device.device_info_json || device.notes) && (
            <View style={styles.techDetails}>
              <Text style={styles.sectionTitle}>Información Técnica</Text>
              {device.notes && (
                <TouchableOpacity
                  style={styles.noteBox}
                  onPress={() => Alert.alert('Notas', device.notes)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.noteText}>{device.notes}</Text>
                </TouchableOpacity>
              )}
              {device.device_info_json && (
                <TouchableOpacity
                  onPress={() => Alert.alert('Información Técnica', device.device_info_json)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jsonText} numberOfLines={3}>
                    {device.device_info_json}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Acciones */}
          {onRevoke && device.state !== 'revoked' && (
            <TouchableOpacity
              style={styles.revokeButton}
              onPress={() => onRevoke(device)}
              disabled={isLoading}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.revokeText}>Revocar Acceso</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const InfoItem: React.FC<{ label: string; value: string; icon: any }> = ({ label, value, icon }) => (
  <TouchableOpacity
    style={styles.infoItem}
    onPress={() => Alert.alert(label, value)}
    activeOpacity={0.7}
  >
    <View style={styles.imgIcon}>
      <Ionicons name={icon} size={16} color={Colors.textSecondary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  currentCard: {
    borderColor: Colors.primary + '40',
    backgroundColor: '#f8f9ff',
  },
  revokedCard: {
    opacity: 0.8,
    backgroundColor: '#f9fafb',
  },
  currentBadgeTop: {
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mainContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    top: -2,
    right: -2,
  },
  titleColumn: {
    flex: 1,
    gap: 4,
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 6,
    color: Colors.textTertiary,
    fontSize: 10,
  },
  lastUsedText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chevronButton: {
    padding: 8,
  },
  miniGrid: { // Resumen colapsado
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  miniItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  miniText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '48%', // Aprox 2 columnas
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imgIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  techDetails: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  noteBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  jsonText: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  revokeButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  revokeText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 14,
  },
});
/**
 * Tarjeta individual de dispositivo biométrico
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { BiometricDevice, formatPlatform, getPlatformIcon } from '../../services/biometricService';
import { formatEnrolledDate, formatLastUsed, getBiometricIcon, getDeviceStatusColor, getDeviceStatusText, getShortDeviceId, } from '../../utils/biometricHelpers';

interface BiometricDeviceCardProps {
  device: BiometricDevice;
  onRevoke?: (device: BiometricDevice) => void;
  onViewDetails?: (device: BiometricDevice) => void;
  isLoading?: boolean;
}

export const BiometricDeviceCard: React.FC<BiometricDeviceCardProps> = ({
  device,
  onRevoke,
  onViewDetails,
  isLoading = false,
}) => {
  const statusColor = getDeviceStatusColor(device);
  const statusText = getDeviceStatusText(device);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewDetails?.(device)}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      {/* Header con icono de plataforma */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: statusColor + '15' }]}>
          <Ionicons
            name={getPlatformIcon(device.platform) as any}
            size={28}
            color={statusColor}
          />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {device.deviceName}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {device.isCurrentDevice && (
          <View style={styles.currentBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          </View>
        )}
      </View>

      {/* Información del dispositivo */}
      <View style={styles.infoSection}>
        <InfoRow
          icon="phone-portrait-outline"
          label="Modelo"
          value={`${device.brand} ${device.modelName}`}
        />
        <InfoRow
          icon={ device.platform === 'ios' ? 'logo-apple' : 'logo-android' }
          label="Sistema"
          value={`${formatPlatform(device.platform)} ${device.osVersion}`}
        />
        <InfoRow
          icon={getBiometricIcon(device.biometricType)}
          label="Biometría"
          value={device.biometricType}
        />
        <InfoRow
          icon="calendar-outline"
          label="Registrado"
          value={formatEnrolledDate(device.enrolledAt)}
        />
        <InfoRow
          icon="time-outline"
          label="Último uso"
          value={formatLastUsed(device.lastUsedAt)}
        />
        <InfoRow
          icon="key-outline"
          label="ID Dispositivo"
          value={getShortDeviceId(device.deviceId)}
        />
      </View>

      {/* Acciones */}
      {onRevoke && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.revokeButton}
            onPress={() => onRevoke(device)}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={styles.revokeButtonText}>Eliminar Biometría</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={16} color={Colors.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  currentBadge: {
    marginLeft: 8,
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  revokeButtonText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
});
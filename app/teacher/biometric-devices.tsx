/**
 * Panel de gestión de dispositivos biométricos
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BiometricDeviceCard } from '../../components/biometric/BiometricDeviceCard';
import { showAlert } from '../../components/showAlert';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import * as biometricOdooService from '../../services-odoo/biometricService';
import { getDeviceInfo } from '../../services/biometricService/deviceInfo';
type BiometricDeviceBackend = biometricOdooService.BiometricDeviceBackend;

export default function BiometricDevicesScreen() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<BiometricDeviceBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  /**
   * Carga los dispositivos biométricos
   */
  const loadDevices = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log('🔄 Cargando dispositivos desde Odoo...');
      }

      setLoading(true);

      // 1. Obtener device_id del dispositivo actual
      const currentDeviceInfo = await getDeviceInfo();
      const currentDeviceId = currentDeviceInfo.deviceId;

      // 2. Obtener dispositivos desde Odoo
      const result = await biometricOdooService.getUserDevices(currentDeviceId);

      if (result.success && result.data) {
        setDevices(result.data);

        if (__DEV__) {
          console.log(`✅ ${result.data.length} dispositivo(s) cargado(s) desde Odoo`);
        }
      } else {
        if (__DEV__) {
          console.error('❌ Error cargando dispositivos:', result.error);
        }
        
        showAlert(
          'Error',
          'No se pudieron cargar los dispositivos biométricos del servidor'
        );
        
        // Fallback: intentar cargar desde almacenamiento local
        try {
          if (__DEV__) {
            console.log('⚠️ Intentando cargar dispositivos locales como fallback...');
          }
          
          const { getBiometricDevices } = await import('../../services/biometricService');
          const localDevices = await getBiometricDevices();
          
          // Mapear dispositivos locales al formato backend
          const mappedDevices: BiometricDeviceBackend[] = localDevices.map(d => ({
            id: 0, // Sin ID de Odoo
            deviceId: d.deviceId,
            deviceName: d.deviceName,
            platform: d.platform as 'ios' | 'android' | 'web',
            osVersion: d.osVersion,
            modelName: d.modelName,
            brand: d.brand,
            isPhysicalDevice: true,
            biometricType: d.biometricType,
            state: 'active' as const,
            isEnabled: true,
            isCurrentDevice: d.isCurrentDevice,
            enrolledAt: d.enrolledAt,
            lastUsedAt: d.lastUsedAt,
            authCount: 0,
            isRecentlyUsed: false,
            isStale: false,
            daysSinceLastUse: -1,
          }));
          
          setDevices(mappedDevices);
          
          if (__DEV__) {
            console.log('⚠️ Usando dispositivos locales como fallback');
          }
        } catch (localError) {
          if (__DEV__) {
            console.error('❌ Error cargando dispositivos locales:', localError);
          }
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error inesperado cargando dispositivos:', error);
      }
      showAlert('Error', 'Ocurrió un error al cargar los dispositivos');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresca la lista de dispositivos
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  }, [loadDevices]);

  /**
   * Maneja la eliminación de biometría de un dispositivo
   */
  const handleRevokeDevice = useCallback(
    async (device: BiometricDeviceBackend) => {
      Alert.alert(
        'Eliminar Biometría',
        `¿Estás seguro de que deseas eliminar la autenticación biométrica de "${device.deviceName}"?\n\n${
          device.isCurrentDevice
            ? 'Este es tu dispositivo actual. Deberás iniciar sesión con usuario y contraseña la próxima vez.'
            : 'Este dispositivo ya no podrá autenticarse con biometría.'
        }`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              setIsRevoking(true);

              try {
                if (__DEV__) {
                  console.log('🗑️ Revocando dispositivo:', device.deviceId);
                }

                // 1. Si es el dispositivo actual, eliminar credenciales locales
                if (device.isCurrentDevice) {
                  const { removeBiometricFromCurrentDevice } = await import(
                    '../../services/biometricService'
                  );
                  const success = await removeBiometricFromCurrentDevice();

                  if (!success) {
                    showAlert('Error', 'No se pudo eliminar la biometría local');
                    setIsRevoking(false);
                    return;
                  }

                  if (__DEV__) {
                    console.log('✅ Credenciales locales eliminadas');
                  }
                }

                // 2. Revocar en Odoo (si tiene ID de Odoo)
                if (device.id && device.id > 0) {
                  const result = await biometricOdooService.revokeDevice(device.id);

                  if (result.success) {
                    showAlert(
                      'Biometría Eliminada',
                      'La autenticación biométrica ha sido eliminada de este dispositivo.'
                    );

                    // Recargar lista desde Odoo
                    await loadDevices();
                  } else {
                    showAlert(
                      'Error',
                      result.error || 'No se pudo revocar el dispositivo en el servidor'
                    );
                  }
                } else {
                  // Si no tiene ID de Odoo, solo mostrar confirmación local
                  showAlert(
                    'Biometría Eliminada',
                    'La autenticación biométrica local ha sido eliminada.'
                  );
                  await loadDevices();
                }
              } catch (error) {
                if (__DEV__) {
                  console.error('❌ Error revocando biometría:', error);
                }
                showAlert('Error', 'Ocurrió un error al eliminar la biometría');
              } finally {
                setIsRevoking(false);
              }
            },
          },
        ]
      );
    },
    [loadDevices]
  );


  /**
   * Muestra detalles del dispositivo
   */
  const handleViewDetails = useCallback((device: BiometricDeviceBackend) => {
    const details = [
      `ID: ${device.deviceId}`,
      '',
      `Modelo: ${device.brand} ${device.modelName}`,
      `Sistema: ${device.platform.toUpperCase()} ${device.osVersion}`,
      `Biometría: ${device.biometricType}`,
      '',
      `Registrado: ${new Date(device.enrolledAt).toLocaleString('es-ES')}`,
      `Último uso: ${
        device.lastUsedAt
          ? new Date(device.lastUsedAt).toLocaleString('es-ES')
          : 'Nunca usado'
      }`,
      '',
      `Estado: ${device.state === 'active' ? 'Activo' : device.state === 'inactive' ? 'Inactivo' : 'Revocado'}`,
      `Autenticaciones: ${device.authCount}`,
    ];

    if (device.daysSinceLastUse >= 0) {
      details.push(`Días sin uso: ${device.daysSinceLastUse}`);
    }

    Alert.alert('Detalles del Dispositivo', details.join('\n'), [{ text: 'Cerrar' }]);
  }, []);

  // Cargar dispositivos al montar
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Calcular estadísticas
  const stats = {
    total: devices.length,
    recentlyUsed: devices.filter(d => d.isRecentlyUsed).length,
    stale: devices.filter(d => d.isStale).length,
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent />
      <>
        <Head>
          <title>Dispositivos Biométricos</title>
        </Head>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Dispositivos Biométricos</Text>
                <Text style={styles.headerSubtitle}>
                  {user.fullName} • {user.username}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
                activeOpacity={0.7}
                disabled={refreshing || loading}
              >
                <Ionicons
                  name="refresh"
                  size={24}
                  color="#fff"
                  style={refreshing ? styles.spinning : undefined}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          >
            <View style={styles.contentContainer}>
              {/* Tarjeta de información */}
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle" size={24} color={Colors.primary} />
                  <Text style={styles.infoTitle}>Gestión Local</Text>
                </View>
                <Text style={styles.infoText}>
                  Actualmente solo puedes ver y gestionar la biometría de este dispositivo.
                </Text>
              </View>

              {/* Estadísticas */}
              {devices.length > 0 && (
                <View style={styles.statsCard}>
                  <Text style={styles.statsTitle}>Resumen</Text>
                  <View style={styles.statsGrid}>
                    <StatBox
                      icon="phone-portrait"
                      label="Dispositivos"
                      value={stats.total.toString()}
                      color={Colors.primary}
                    />
                    <StatBox
                      icon="checkmark-circle"
                      label="Activos"
                      value={stats.recentlyUsed.toString()}
                      color={Colors.success}
                    />
                    <StatBox
                      icon="time"
                      label="Inactivos"
                      value={stats.stale.toString()}
                      color={Colors.warning}
                    />
                  </View>
                </View>
              )}

              {/* Lista de dispositivos */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Cargando dispositivos...</Text>
                </View>
              ) : devices.length > 0 ? (
                <View style={styles.devicesSection}>
                  <Text style={styles.sectionTitle}>Dispositivos Registrados</Text>
                  {devices.map((device) => (
                    <BiometricDeviceCard
                      key={device.deviceId}
                      device={device}
                      onRevoke={handleRevokeDevice}
                      onViewDetails={handleViewDetails}
                      isLoading={isRevoking}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="finger-print-outline" size={64} color={Colors.textTertiary} />
                  </View>
                  <Text style={styles.emptyTitle}>Sin Dispositivos</Text>
                  <Text style={styles.emptyText}>
                    No tienes ningún dispositivo con autenticación biométrica habilitada.
                  </Text>
                  <Text style={styles.emptyHint}>
                    Habilita la biometría al iniciar sesión para acceder rápidamente.
                  </Text>
                </View>
              )}

              <View style={{ height: 20 }} />
            </View>
          </ScrollView>
        </View>
      </>
    </SafeAreaProvider>
  );
}

interface StatBoxProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

const StatBox: React.FC<StatBoxProps> = ({ icon, label, value, color }) => {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 60 : 70,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinning: {
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: '#0369a1',
    lineHeight: 20,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  devicesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontStyle: 'italic',
  },
});
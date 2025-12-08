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
import * as authService from '../../services-odoo/authService';
import type { BiometricDeviceBackend } from '../../services-odoo/biometricService';
import * as biometricOdooService from '../../services-odoo/biometricService';
import { getDeviceInfo } from '../../services/biometricService/deviceInfo';

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

        // No mostrar alerta si la sesión ya expiró (handleSessionExpired() ya lo manejó)
        if (!result.isSessionExpired) {
          showAlert(
            'Error',
            'No se pudieron cargar los dispositivos biométricos del servidor'
          );
        }

        // Fallback: intentar cargar desde almacenamiento local
        try {
          console.log('⚠️ Intentando cargar dispositivos locales como fallback...');
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
            hasActiveSession: d.isCurrentDevice,
          }));

          setDevices(mappedDevices);
        } catch (localError) {
          console.error('❌ Error cargando dispositivos locales:', localError);
        }
      }
    } catch (error) {
      console.error('❌ Error inesperado cargando dispositivos:', error);
      showAlert('Error', 'Ocurrió un error al cargar los dispositivos');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresca la lista de dispositivos
   */
  const onRefresh = useCallback(async () => {
    const serverHealth = await authService.checkServerHealth();

    if (!serverHealth.ok) {
      if (__DEV__) {
        console.log('🔴 Servidor no disponible durante refresh');
      }
      showAlert(
        'Sin conexión',
        'No se puede conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.'
      );
      return;
    }

    const validSession = await authService.verifySession();


    if (!validSession) {
      if (__DEV__) {
        console.log('❌ Sesión no válida durante refresh');
      }
      return;
    }
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
        `¿Estás seguro de que deseas eliminar la autenticación biométrica de "${device.deviceName}"?\n\n${device.isCurrentDevice
          ? 'Este es tu dispositivo actual. Deberás iniciar sesión con usuario y contraseña la próxima vez.'
          : 'Este dispositivo ya no podrá autenticarse con biometría.'
        }`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              setIsRevoking(true);
              try {
                // 1. Si es el dispositivo actual, eliminar credenciales locales
                if (device.isCurrentDevice) {
                  const { removeBiometricFromCurrentDevice } = await import('../../services/biometricService');
                  const success = await removeBiometricFromCurrentDevice();

                  if (!success) {
                    showAlert('Error', 'No se pudo eliminar la biometría local');
                    setIsRevoking(false);
                    return;
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
                    await loadDevices();
                  } else {
                    // No mostrar alerta si la sesión ya expiró
                    if (!result.isSessionExpired) {
                      showAlert('Error', result.error || 'No se pudo revocar el dispositivo en el servidor');
                    }
                  }
                } else {
                  // Si no tiene ID de Odoo, solo mostrar confirmación local
                  showAlert('Biometría Eliminada', 'La autenticación biométrica local ha sido eliminada.');
                  await loadDevices();
                }
              } catch (error) {
                console.error('❌ Error revocando biometría:', error);
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

  const handleViewDetails = useCallback((device: BiometricDeviceBackend) => {
    // Esta función se puede expandir para navegar a una pantalla de detalles dedicada si fuera necesario,
    // pero ahora la tarjeta maneja la expansión inline.
    // Mantenemos esto por compatibilidad con la prop.
  }, []);

  // Cargar dispositivos al montar
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Calcular estadísticas
  const stats = {
    total: devices.length,
    activeSessions: devices.filter(d => d.hasActiveSession).length,
    revoked: devices.filter(d => d.state === 'revoked').length,
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
                <Text style={styles.headerTitle}>Dispositivos Conectados</Text>
                <Text style={styles.headerSubtitle}>
                  {user.fullName}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => router.push('/admin/auth-history' as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={24} color="#fff" />
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

              {/* Resumen de Estado */}
              <View style={styles.summaryGrid}>
                <SummaryItem
                  label="Dispositivos"
                  value={stats.total.toString()}
                  icon="hardware-chip-outline"
                  color={Colors.primary}
                />
                <SummaryItem
                  label="Sesiones"
                  value={stats.activeSessions.toString()}
                  icon="radio-button-on-outline"
                  color={Colors.success}
                />
                <SummaryItem
                  label="Revocados"
                  value={stats.revoked.toString()}
                  icon="trash-outline"
                  color={Colors.error}
                />
              </View>


              {/* Tarjeta de información */}
              <View style={styles.infoCard}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.primary} style={{ marginTop: 2 }} />
                <Text style={styles.infoText}>
                  Gestiona los dispositivos que tienen acceso biométrico a tu cuenta. Revoca el acceso si no reconoces alguno.
                </Text>
              </View>

              {/* Lista de dispositivos */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Sincronizando dispositivos...</Text>
                </View>
              ) : devices.length > 0 ? (
                <View style={styles.devicesSection}>
                  <Text style={styles.sectionTitle}>Tus Dispositivos ({devices.length})</Text>
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
                    No tienes dispositivos vinculados con biometría activada.
                  </Text>
                  <TouchableOpacity
                    style={styles.enableButton}
                    onPress={() => router.back()} // O navegar a ajustes si hubiera
                  >
                    <Text style={styles.enableButtonText}>Volver al Inicio</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        </View>
      </>
    </SafeAreaProvider>
  );
}

const SummaryItem: React.FC<{ label: string; value: string; icon: any; color: string }> = ({ label, value, icon, color }) => (
  <View style={styles.summaryItem}>
    <View style={[styles.summaryIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.primary + '08',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  devicesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
    marginLeft: 4,
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginBottom: 24,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  enableButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
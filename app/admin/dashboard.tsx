import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { showAlert } from '../../components/showAlert';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services-odoo/authService';
import { getSessionTimeRemaining } from '../../services-odoo/authService';


export default function AdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string>('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      if (__DEV__) {
        console.log('🔄 Refrescando dashboard...');
      }


      const serverHealth = await authService.checkServerHealth();


      if (!serverHealth.ok) {
        if (__DEV__) {
          console.log('🔴 Servidor no disponible durante refresh');
        }
        setIsOfflineMode(true);
        showAlert(
          'Sin conexión',
          'No se puede conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.'
        );
        return;
      }


      const validSession = await authService.verifySession();


      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión no válida durante refresh - El API ya manejó la expiración');
        }
        // ⚠️ NO llamar handleSessionExpired() - el API lo hace automáticamente
        return;
      }


      if (updateUser) {
        await updateUser({
          fullName: validSession.fullName,
          email: validSession.email,
        });
      }

      const timeRemaining = getSessionTimeRemaining(validSession);
      setSessionTimeRemaining(timeRemaining);
      setIsOfflineMode(false);

      if (__DEV__) {
        console.log('✅ Dashboard actualizado');
      }
    } catch (error) {
      if (__DEV__) {
        console.log('❌ Error al refrescar:', error);
      }
      setIsOfflineMode(true);
      showAlert(
        'Error',
        'No se pudo actualizar la información. Verifica tu conexión e intenta nuevamente.'
      );
    } finally {
      setRefreshing(false);
    }
  }, [updateUser]);


  useEffect(() => {
    if (user) {
      const timeRemaining = getSessionTimeRemaining(user);
      setSessionTimeRemaining(timeRemaining);

      // Actualizar cada minuto
      const interval = setInterval(() => {
        const newTimeRemaining = getSessionTimeRemaining(user);
        setSessionTimeRemaining(newTimeRemaining);
      }, 60000); // 60 segundos

      return () => clearInterval(interval);
    }
  }, [user]);

  /**
   * Obtiene color según tiempo restante
   */
  const getTimeRemainingColor = (timeString: string): string => {
    if (timeString.includes('Expirada')) return Colors.error;

    // Extraer horas si existen
    const hoursMatch = timeString.match(/(\d+)h/);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;

    if (hours >= 3) return Colors.success; // Verde: 3h o más
    if (hours >= 1) return Colors.warning; // Amarillo: 1-3h
    return Colors.error; // Rojo: menos de 1h
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
    // ✅ REPLACE para limpiar stack - no queremos que vuelva atrás al dashboard
    router.push('/login');
  };


  if (!user) {
    return null;
  }


  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent />
      <>
        <Head>
          <title>Panel Principal</title>
        </Head>
        <View style={styles.container}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.schoolName}>U.E.N.B. Ciudad Jardín</Text>
                <Text style={styles.greeting}>Hola, {user.fullName || 'Admin'}</Text>
                <Text style={styles.userName}>Panel Principal</Text>
                <View style={styles.roleContainer}>
                  <View style={styles.roleBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#fff" />
                    <Text style={styles.roleText}>Administrador</Text>
                  </View>
                  {__DEV__ && (
                    <View style={styles.devBadge}>
                      <Ionicons name="code-working" size={10} color="#fff" />
                      <Text style={styles.devBadgeText}>DEV</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.7}>
                <LinearGradient
                  colors={['#ffffff', '#f0f9ff']}
                  style={styles.avatar}
                >
                  <Ionicons name="person" size={28} color={Colors.primary} />
                </LinearGradient>
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
                title="Actualizando..."
                titleColor={Colors.textSecondary}
              />
            }
          >
            <View style={styles.dashboardContent}>


              {isOfflineMode && (
                <View style={styles.offlineBanner}>
                  <Ionicons name="cloud-offline" size={20} color="#fff" />
                  <Text style={styles.offlineText}>
                    Sin conexión • Funciones limitadas
                  </Text>
                </View>
              )}


              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="school-outline" size={24} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Gestión Académica</Text>
                </View>


                <View style={styles.cardsGrid}>
                  <DashboardCard
                    icon="person-add-outline"
                    title="Nueva Persona"
                    description="Registrar estudiantes"
                    accentColor="#3b82f6"
                    disabled={isOfflineMode}
                    onPress={() => router.push('/admin/academic-management/register-person/select-role' as any)}
                  />

                  <DashboardCard
                    icon="book-outline"
                    title="Sección/Materia"
                    description="Gestionar secciones"
                    accentColor="#10b981"
                    disabled={true}
                    onPress={() => router.push('/admin/academic-management/register-section-subject/select-option' as any)}
                  />

                  <DashboardCard
                    icon="people-outline"
                    title="Directorio"
                    description="Ver registros"
                    accentColor="#8b5cf6"
                    disabled={isOfflineMode}
                    onPress={() => router.push('/admin/academic-management/lists-persons/select-role' as any)}
                  />

                  <DashboardCard
                    icon="library-outline"
                    title="Académico"
                    description="Secciones y materias"
                    accentColor="#f59e0b"
                    disabled={isOfflineMode}
                    onPress={() => router.push('/admin/academic-management/section-subject/select-option' as any)}
                  />
                </View>
              </View>


              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="settings-outline" size={24} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Gestión del Sistema</Text>
                </View>


                <View style={styles.cardsGrid}>
                  <DashboardCard
                    icon="key-outline"
                    title="Usuarios"
                    description="Accesos del sistema"
                    accentColor="#ef4444"
                    disabled={true}
                    onPress={() => router.push('/admin/prueba' as any)}
                  />

                  <DashboardCard
                    icon="stats-chart-outline"
                    title="Reportes"
                    description="Estadísticas"
                    accentColor="#06b6d4"
                    disabled={true}
                    onPress={() => { }}
                  />

                  <DashboardCard
                    icon="calendar-outline"
                    title="Año Escolar"
                    description="Períodos"
                    accentColor="#ec4899"
                    disabled={true}
                    onPress={() => { }}
                  />

                  <DashboardCard
                    icon="cog-outline"
                    title="Configuración"
                    description="Ajustes generales"
                    accentColor="#6366f1"
                    disabled={isOfflineMode}
                    onPress={() => router.push('/admin/biometric-devices' as any)}
                  />
                </View>
              </View>


              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <View style={styles.infoHeaderLeft}>
                    <View style={styles.infoIconWrapper}>
                      <Ionicons name="person" size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.infoTitle}>Mi Perfil</Text>
                  </View>
                  {refreshing && (
                    <View style={styles.refreshingBadge}>
                      <Text style={styles.refreshingText}>Actualizando...</Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoContent}>
                  <InfoRow label="Usuario" value={user.username} icon="at" />
                  <InfoRow label="Email" value={user.email} icon="mail" />
                  <InfoRow label="Rol" value="Administrador" icon="shield-checkmark" />
                  <InfoRow label="Sesión" value={sessionTimeRemaining} icon="time" valueColor={getTimeRemainingColor(sessionTimeRemaining)} />
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.error, '#b91c1c']}
                  style={styles.logoutGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="log-out-outline" size={22} color="#fff" />
                  <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </LinearGradient>
              </TouchableOpacity>


              <View style={{ height: 20 }} />
            </View>
          </ScrollView>
        </View>
      </>
    </SafeAreaProvider>
  );
}


interface DashboardCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accentColor: string;
  disabled?: boolean;
  onPress: () => void;
}


const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, onPress, disabled }) => {
  const handlePress = () => {
    if (disabled) {
      showAlert('Función no disponible', 'Esta función está deshabilitada temporalmente.');
      return;
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      {/* Backdrop Icon for Visual Interest */}
      <Ionicons name={icon} size={100} color={Colors.primary} style={styles.cardBackdropIcon} />

      <View style={styles.cardIconContainer}>
        <Ionicons name={icon} size={30} color={disabled ? Colors.textSecondary : Colors.primary} />
      </View>

      <View>
        <Text style={[styles.cardTitle, disabled && styles.cardTitleDisabled]}>{title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{description}</Text>
      </View>

      {!disabled && (
        <Ionicons name="arrow-forward" size={16} color={Colors.primary} style={styles.arrowIcon} />
      )}

      {disabled && (
        <View style={styles.disabledIndicator}>
          <Ionicons name="lock-closed" size={16} color={Colors.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );
};


interface InfoRowProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  highlight?: boolean;
  valueColor?: string;
}


const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon, highlight, valueColor }) => {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrapper, highlight && styles.infoIconWrapperHighlight]}>
        <Ionicons
          name={icon}
          size={18}
          color={highlight ? Colors.warning : Colors.primary}
        />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, highlight && styles.infoValueHighlight, valueColor && { color: valueColor }]}>
          {value}
        </Text>
      </View>
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
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: -40, // Increased overlap
    zIndex: 1,
    overflow: 'hidden', // Ensure gradient is clipped if needed
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  schoolName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -1,
  },
  userName: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    gap: 4,
  },
  devBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  avatarContainer: {
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 0,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  dashboardContent: {
    padding: 20,
    paddingTop: 60, // Reset since we handle overlap
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 0,
    //marginTop: 50,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginTop: 0,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 0,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  refreshingBadge: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  refreshingText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  infoContent: {
    marginTop: 20,
    gap: 0,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  infoIconWrapperHighlight: {
    backgroundColor: '#fffbeb',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoValueHighlight: {
    color: Colors.warning,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  card: {
    width: '46%',
    margin: '2%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    aspectRatio: 1.0,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(203, 213, 225, 0.6)', // Added subtle border for better definition
  },
  cardDisabled: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
    elevation: 0,
  },
  cardBackdropIcon: {
    position: 'absolute',
    right: -12,
    bottom: -12,
    opacity: 0.1, // Increased opacity slightly
    transform: [{ rotate: '-15deg' }],
  },
  cardIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardTitleDisabled: {
    color: Colors.textSecondary,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 'auto',
  },
  arrowIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.3,
  },
  disabledIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  logoutButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 60,
    marginHorizontal: 4,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

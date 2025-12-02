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
import { formatTimeAgo } from '../../utils/formatHelpers';


export default function AdminDashboard() {
  const { user, logout, updateUser, handleSessionExpired } = useAuth();
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
          console.log('❌ Sesión no válida durante refresh');
        }
        handleSessionExpired();
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
  }, [handleSessionExpired, updateUser]);


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
    router.replace('/login');
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
                <Text style={styles.greeting}>Hola de nuevo 👋</Text>
                <Text style={styles.userName}>{user.fullName}</Text>
                <View style={styles.roleContainer}>
                  <View style={styles.roleBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
                    <Text style={styles.roleText}>Administrador</Text>
                  </View>
                  {__DEV__ && (
                    <View style={styles.devBadge}>
                      <Ionicons name="code-working" size={10} color="#f59e0b" />
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
                    description="Registrar estudiantes o personal"
                    accentColor="#3b82f6"
                    disabled={isOfflineMode}
                    onPress={() => router.push('/admin/academic-management/register-person/select-role' as any)}
                  />
                  
                  <DashboardCard
                    icon="book-outline"
                    title="Sección/Materia"
                    description="Gestionar secciones y materias"
                    accentColor="#10b981"
                    disabled={true}
                    onPress={() => router.push('/admin/academic-management/register-section-subject/select-option' as any)}
                  />
                  
                  <DashboardCard
                    icon="people-outline"
                    title="Directorio"
                    description="Ver personas registradas"
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
                    description="Administrar accesos"
                    accentColor="#ef4444"
                    disabled={true}
                    onPress={() => router.push('/admin/prueba' as any)}
                  />
                  
                  <DashboardCard
                    icon="stats-chart-outline"
                    title="Reportes"
                    description="Estadísticas del sistema"
                    accentColor="#06b6d4"
                    disabled={true}
                    onPress={() => {}}
                  />
                  
                  <DashboardCard
                    icon="calendar-outline"
                    title="Año Escolar"
                    description="Gestionar períodos"
                    accentColor="#ec4899"
                    disabled={true}
                    onPress={() => {}}
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
                    <Ionicons name="person-circle-outline" size={24} color={Colors.primary} />
                    <Text style={styles.infoTitle}>Mi Información</Text>
                  </View>
                  {refreshing && (
                    <View style={styles.refreshingBadge}>
                      <Text style={styles.refreshingText}>Actualizando</Text>
                    </View>
                  )}
                </View>


                <View style={styles.infoContent}>
                  <InfoRow label="Usuario" value={user.username} icon="at" />
                  <InfoRow label="Email" value={user.email} icon="mail" />
                  <InfoRow label="Rol" value="Administrador Principal" icon="shield-checkmark" />
                  <InfoRow label="Última sesión" value={formatTimeAgo(user.createdAt)} icon="time" />
                  <InfoRow label="Tiempo restante de la sesión" value={sessionTimeRemaining} icon="hourglass-outline" valueColor={getTimeRemainingColor(sessionTimeRemaining)} />
                  {__DEV__ && (
                    <InfoRow 
                      label="Entorno" 
                      value="Desarrollo" 
                      icon="code-slash"
                      highlight
                    />
                  )}
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


const DashboardCard: React.FC<DashboardCardProps> = ({ 
  icon, 
  title, 
  description, 
  accentColor,
  disabled, 
  onPress 
}) => {
  const handlePress = () => {
    if (disabled) {
      showAlert(
        'Error',
        'Esta función esta deshabilitada o requiere conexión a internet.'
      );
      return;
    }
    onPress();
  };


  return (
    <TouchableOpacity 
      style={[ styles.card, disabled && styles.cardDisabled ]} 
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={[
        styles.cardIconContainer,
        { backgroundColor: disabled ? '#f3f4f6' : accentColor + '15' }
      ]}>
        <Ionicons 
          name={icon} 
          size={28} 
          color={disabled ? Colors.textSecondary : accentColor} 
        />
      </View>
      <Text style={[styles.cardTitle, disabled && styles.cardTitleDisabled]}>
        {title}
      </Text>
      <Text style={styles.cardDescription}>{description}</Text>
      
      {disabled && (
        <View style={styles.disabledIndicator}>
          <Ionicons name="cloud-offline-outline" size={16} color={Colors.textSecondary} />
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
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      }
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginBottom: 6,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    gap: 4,
  },
  devBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  avatarContainer: {
    marginLeft: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      }
    }),
  },
  content: {
    flex: 1,
  },
  dashboardContent: {
    padding: 20,
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
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  card: {
    width: '48%',
    margin: '1%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      }
    }),
  },
  cardDisabled: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardTitleDisabled: {
    color: Colors.textSecondary,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  disabledIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 4,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      }
    }),
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  refreshingBadge: {
    backgroundColor: Colors.primary + '15',
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
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoIconWrapperHighlight: {
    backgroundColor: '#fef3c7',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  infoValueHighlight: {
    color: Colors.warning,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 50,
    ...Platform.select({
      ios: {
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      }
    }),
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

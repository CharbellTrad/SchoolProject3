import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Head from 'expo-router/head';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import { formatTimeAgo } from '../../utils/formatHelpers';
import * as authService from '../../services-odoo/authService';
import { showAlert } from '../../components/showAlert';

export default function AdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Función que se ejecuta al deslizar hacia abajo
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      if (__DEV__) {
        console.log('🔄 Refrescando dashboard...');
      }

      const validSession = await authService.verifySession();

      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión no válida durante refresh');
        }
        showAlert(
          'Sesión Expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [
            {
              text: 'Aceptar',
              onPress: async () => {
                await logout();
                router.replace('/login');
              },
            },
          ]
        );
        return;
      }

      if (updateUser) {
        await updateUser({
          fullName: validSession.fullName,
          email: validSession.email,
        });
      }

      if (__DEV__) {
        console.log('✅ Dashboard actualizado');
      }
    } catch (error) {
      if (__DEV__) {
        console.log('❌ Error al refrescar:', error);
      }
      showAlert(
        'Error',
        'No se pudo actualizar la información. Verifica tu conexión.'
      );
    } finally {
      setRefreshing(false);
    }
  }, [logout, updateUser]);

  const handleLogout = async (): Promise<void> => {
    await logout();
    router.replace('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Panel Principal</title>
      </Head>
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Bienvenido</Text>
              <Text style={styles.userName}>{user.fullName}</Text>
              <View style={styles.roleContainer}>
                <Text style={styles.userRole}>Administrador</Text>
                {__DEV__ && (
                  <View style={styles.devBadge}>
                    <Ionicons name="code-working" size={12} color="#fff" />
                    <Text style={styles.devBadgeText}>DEV</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={Colors.primary} />
              </View>
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
              colors={[Colors.primary]} // Android
              tintColor={Colors.primary} // iOS
              title="Actualizando..." // iOS
              titleColor={Colors.textSecondary} // iOS
            />
          }
        >
          <View style={styles.dashboardContent}>
            <Text style={styles.sectionTitle}>Gestión Académica</Text>

            <View style={styles.cardsGrid}>
              <DashboardCard
                icon="person-add"
                title="Nueva Persona"
                description="Registrar estudiantes, o personal académico en el sistema"
                color="#3b82f6"
                onPress={() => router.push('/admin/academic-management/register-person/select-role' as any)}
              />
              
              <DashboardCard
                icon="school"
                title="Nueva Sección o Materia"
                description="Gestionar secciones y materias del año"
                color="#10b981"
                onPress={() => router.push('/admin/academic-management/register-section-subject/select-option' as any)}
              />
              
              <DashboardCard
                icon="people-circle"
                title="Directorio de Personas"
                description="Gestionar personas registradas en el sistema"
                color="#8b5cf6"
                onPress={() => router.push('/admin/academic-management/lists-persons/select-role' as any)}
              />
              
              <DashboardCard
                icon="library"
                title="Directorio Académico"
                description="Gestionar secciones o materias disponibles en el sistema"
                color="#f59e0b"
                onPress={() => router.push('/admin/academic-management/list-section-subject/select-option' as any)}
              />
            </View>

            <Text style={styles.sectionTitle}>Gestión del Sistema</Text>

            <View style={styles.cardsGrid}>
              <DashboardCard
                icon="key"
                title="Gestionar Usuarios"
                description="Crear y administrar usuarios con acceso"
                color="#ef4444"
                onPress={() => router.push('/admin/prueba' as any)}
              />
              
              <DashboardCard
                icon="stats-chart"
                title="Reportes"
                description="Ver estadísticas y reportes del sistema"
                color="#06b6d4"
                onPress={() => {}}
              />
              
              <DashboardCard
                icon="calendar"
                title="Año Escolar"
                description="Gestionar períodos y año escolar"
                color="#ec4899"
                onPress={() => {}}
              />
              
              <DashboardCard
                icon="settings"
                title="Configuración"
                description="Ajustes generales del sistema"
                color="#6366f1"
                onPress={() => {}}
              />
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoTitle}>Mi Información</Text>
                {refreshing && (
                  <View style={styles.refreshingBadge}>
                    <Text style={styles.refreshingText}>Actualizando...</Text>
                  </View>
                )}
              </View>
              <InfoRow label="Usuario" value={user.username} icon="person-outline" />
              <InfoRow label="Email" value={user.email} icon="mail-outline" />
              <InfoRow label="Rol" value="Administrador Principal" icon="shield-checkmark-outline" />
              <InfoRow label="Último inicio de sesión" value={formatTimeAgo(user.createdAt)} icon="calendar-outline" />
              {__DEV__ && (
                <InfoRow 
                  label="Modo" 
                  value="Desarrollo" 
                  icon="code-working"
                  valueStyle={{ color: Colors.warning, fontWeight: '700' }}
                />
              )}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

interface DashboardCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, color, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.cardIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </TouchableOpacity>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  valueStyle?: any;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon, valueStyle }) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.5)',
    gap: 4,
  },
  devBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFC107',
    letterSpacing: 0.5,
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
  },
  dashboardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 24,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  refreshingBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshingText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: Colors.error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
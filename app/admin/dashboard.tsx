/**
 * Admin Dashboard - Modular Architecture
 * Uses modular components for each tab, exactly matching Odoo school_year_view.xml
 * 
 * Tabs:
 * 1. Dashboard General - Rendimiento general, distribución, aprobación, comparativa, top 10
 * 2. Media General - Config, stats, secciones, rendimiento, top 3 por sección
 * 3. Técnico Medio - Config, stats, menciones, rendimiento, top 3 por sección
 * 4. Primaria - Config, stats, secciones, rendimiento, top 3 por sección
 * 5. Preescolar - Config, stats, secciones (sin materias), rendimiento, top 3 por sección
 * 6. Estudiantes - Lista completa con estado y fecha
 * 7. Profesores - Resumen, stats por nivel, materias difíciles
 * 8. Evaluaciones - Stats y timeline
 */

import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserAvatar } from '../../components/common/UserAvatar';
import {
  DashboardGeneralTab,
  EvaluationsTab,
  KPICard,
  LevelTab,
  ProfessorsTab,
  StudentsTab,
  TecnicoMedioTab,
} from '../../components/dashboard';
import { showAlert } from '../../components/showAlert';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services-odoo/authService';
import { getSessionTimeRemaining } from '../../services-odoo/authService';
import * as dashboardService from '../../services-odoo/dashboardService';
import { DashboardData } from '../../services-odoo/dashboardService';

type DashboardTab = 'dashboard' | 'secundary' | 'tecnico' | 'primary' | 'pre' | 'students' | 'professors' | 'evaluations';

const DASHBOARD_TABS: { id: DashboardTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'dashboard', label: 'Dashboard General', icon: 'stats-chart-outline' },
  { id: 'secundary', label: 'Media General', icon: 'school-outline' },
  { id: 'tecnico', label: 'Técnico Medio', icon: 'build-outline' },
  { id: 'primary', label: 'Primaria', icon: 'book-outline' },
  { id: 'pre', label: 'Preescolar', icon: 'happy-outline' },
  { id: 'students', label: 'Estudiantes', icon: 'people-outline' },
  { id: 'professors', label: 'Profesores', icon: 'person-outline' },
  { id: 'evaluations', label: 'Evaluaciones', icon: 'clipboard-outline' },
];

export default function AdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');

  const loadDashboardData = useCallback(async () => {
    try {
      const result = await dashboardService.getCurrentSchoolYearDashboard(true);
      if (result.success && result.data) {
        setDashboardData(result.data);
        setIsOfflineMode(false);
      }
    } catch {
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const serverHealth = await authService.checkServerHealth();
      if (!serverHealth.ok) {
        setIsOfflineMode(true);
        showAlert('Sin conexión', 'No se puede conectar con el servidor.');
        return;
      }
      const validSession = await authService.verifySession();
      if (!validSession) return;
      if (updateUser) {
        await updateUser({
          fullName: validSession.fullName,
          email: validSession.email,
          imageUrl: validSession.imageUrl,
        });
      }
      setSessionTimeRemaining(getSessionTimeRemaining(validSession));
      await loadDashboardData();
    } catch {
      setIsOfflineMode(true);
    } finally {
      setRefreshing(false);
    }
  }, [updateUser, loadDashboardData]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  useEffect(() => {
    if (user) {
      setSessionTimeRemaining(getSessionTimeRemaining(user));
      const interval = setInterval(() => setSessionTimeRemaining(getSessionTimeRemaining(user)), 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const handleLogout = async () => { await logout(); router.push('/login'); };

  if (!user) return null;

  const yearName = dashboardData?.schoolYear?.name || 'Año Escolar';
  const d = dashboardData;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardGeneralTab data={d} loading={loading} />;
      case 'secundary': return <LevelTab level="secundary" levelName="Media General" data={d} color={Colors.primary} />;
      case 'tecnico': return <TecnicoMedioTab data={d} />;
      case 'primary': return <LevelTab level="primary" levelName="Primaria" data={d} color={Colors.success} />;
      case 'pre': return <LevelTab level="pre" levelName="Preescolar" data={d} color="#ec4899" />;
      case 'students': return <StudentsTab data={d} />;
      case 'professors': return <ProfessorsTab data={d} />;
      case 'evaluations': return <EvaluationsTab data={d} />;
      default: return null;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Head><title>{yearName} - Dashboard</title></Head>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.menuBtn} onPress={openDrawer}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.yearName}>{yearName}</Text>
              {d?.schoolYear?.state && (
                <View style={[styles.statusBadge,
                d.schoolYear.state === 'active' && styles.statusActive,
                d.schoolYear.state === 'finished' && styles.statusFinished
                ]}>
                  <Text style={styles.statusText}>
                    {d.schoolYear.state === 'active' ? 'En Curso' : d.schoolYear.state === 'finished' ? 'Finalizado' : 'Borrador'}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity>
              <UserAvatar imageUrl={user.imageUrl} size={40} iconColor={Colors.primary}
                gradientColors={['#fff', '#fff']} borderRadius={12} />
            </TouchableOpacity>
          </View>
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Hola, {user.fullName?.split(' ')[0] || 'Admin'}</Text>
            <Text style={styles.subtitle}>Bienvenido al panel de administración</Text>
          </View>
        </LinearGradient>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <KPICard icon="people" value={d?.kpis.totalStudentsCount ?? 0} label="Estudiantes" color={Colors.primary} loading={loading} />
          <KPICard icon="checkmark-circle" value={d?.kpis.approvedStudentsCount ?? 0} label="Aprobados" color={Colors.success} loading={loading} />
          <KPICard icon="layers" value={d?.kpis.totalSectionsCount ?? 0} label="Secciones" color={Colors.info} loading={loading} />
          <KPICard icon="person" value={d?.kpis.totalProfessorsCount ?? 0} label="Profesores" color={Colors.warning} loading={loading} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {DASHBOARD_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons name={tab.icon} size={16} color={activeTab === tab.id ? Colors.primary : Colors.textSecondary} />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          <View style={styles.contentInner}>
            {isOfflineMode && (
              <View style={styles.offlineBanner}>
                <Ionicons name="cloud-offline" size={18} color="#fff" />
                <Text style={styles.offlineText}>Modo sin conexión</Text>
              </View>
            )}

            {renderTabContent()}

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.sessionRow}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.sessionText}>{sessionTimeRemaining || 'Cargando...'}</Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color={Colors.error} />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },

  // Header
  header: { paddingTop: Platform.OS === 'android' ? 44 : 54, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center', flex: 1 },
  yearName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  statusActive: { backgroundColor: 'rgba(16, 185, 129, 0.3)' },
  statusFinished: { backgroundColor: 'rgba(107, 114, 128, 0.3)' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  greetingRow: { marginTop: 4 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // KPIs
  kpiRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 10, marginTop: -10 },

  // Tabs
  tabContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.backgroundSecondary, gap: 6 },
  tabActive: { backgroundColor: Colors.primary + '10' },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },

  // Content
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 100 },

  // Offline
  offlineBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warning, padding: 12, borderRadius: 12, marginBottom: 16, gap: 10 },
  offlineText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionText: { fontSize: 12, color: Colors.textSecondary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.error + '10', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  logoutText: { fontSize: 13, fontWeight: '600', color: Colors.error },
});

/**
 * Admin Dashboard - enhanced visual design
 * Uses modular components with modern glassmorphism and animations
 */
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserAvatar } from '../../components/common/UserAvatar';
import {
  AnimatedBadge,
  DashboardGeneralTab,
  EvaluationsTab,
  GlassButton,
  LapsosTimeline,
  LapsosTimelineSkeleton,
  LevelTab,
  ProfessorsTab,
  StudentsTab,
  TecnicoMedioTab
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
  { id: 'dashboard', label: 'General', icon: 'grid-outline' },
  { id: 'secundary', label: 'Media G.', icon: 'school-outline' },
  { id: 'tecnico', label: 'Técnico', icon: 'construct-outline' },
  { id: 'primary', label: 'Primaria', icon: 'book-outline' },
  { id: 'pre', label: 'Preescolar', icon: 'happy-outline' },
  { id: 'students', label: 'Estudiantes', icon: 'people-outline' },
  { id: 'professors', label: 'Profesores', icon: 'person-outline' },
  { id: 'evaluations', label: 'Evaluaciones', icon: 'clipboard-outline' },
];

const TabTransition = ({ children, activeTab }: { children: React.ReactNode, activeTab: string }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(20);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, [activeTab]);

  return <Animated.View style={{ opacity, transform: [{ translateY }], flex: 1 }}>{children}</Animated.View>;
}

export default function AdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [forceSkeletons, setForceSkeletons] = useState(false); // Debug state
  const insets = useSafeAreaInsets();

  const scrollViewRef = useRef<ScrollView>(null);
  const isInitialLoadRef = useRef(true); // Track if this is the first load

  // Animation refs
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const kpiTranslateY = useRef(new Animated.Value(30)).current;
  const kpiOpacity = useRef(new Animated.Value(0)).current;

  // Scroll Animation for LapsosTimelinee
  const scrollY = useRef(new Animated.Value(0)).current;

  const timelineHeight = scrollY.interpolate({
    inputRange: [0, 250], // Extended range for ultra-smooth animation
    outputRange: [100, 0],
    extrapolate: 'clamp',
  });

  const timelineOpacity = scrollY.interpolate({
    inputRange: [0, 180], // Stays visible longer
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const timelineTranslateY = scrollY.interpolate({
    inputRange: [0, 250],
    outputRange: [0, -30], // Slightly more movement for parallax feel
    extrapolate: 'clamp',
  });

  const timelineMargin = scrollY.interpolate({
    inputRange: [0, 250],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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
    // User requested "enter from zero" experience:
    setLoading(true);
    setForceSkeletons(false);
    scrollY.setValue(0);
    isInitialLoadRef.current = false; // Mark as NOT initial load for animations

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
      setLoading(false); // Ensure skeletons turn off even if checks fail early
    }
  }, [updateUser, loadDashboardData]);

  useEffect(() => {
    loadDashboardData();
    // Start entry animations
    Animated.sequence([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(kpiTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(kpiOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ]).start();
  }, [loadDashboardData]);

  useEffect(() => {
    if (user) {
      setSessionTimeRemaining(getSessionTimeRemaining(user));
      const interval = setInterval(() => setSessionTimeRemaining(getSessionTimeRemaining(user)), 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Scroll to top when switching tabs
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    // Smoothly reset timeline animation to prevent flicker
    Animated.timing(scrollY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [activeTab, scrollY]);

  const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());
  const handleLogout = async () => { await logout(); router.push('/login'); };

  if (!user) return null;

  const yearName = dashboardData?.schoolYear?.name || 'Año Escolar';
  const d = dashboardData;

  const renderTabContent = () => {
    const skipAnimations = !isInitialLoadRef.current;
    switch (activeTab) {
      case 'dashboard': return <DashboardGeneralTab data={d} loading={loading} skipAnimations={skipAnimations} />;
      case 'secundary': return <LevelTab level="secundary" levelName="Media General" data={d} color={Colors.levelSecundary} loading={loading} skipAnimations={skipAnimations} />;
      case 'tecnico': return <TecnicoMedioTab data={d} loading={loading} skipAnimations={skipAnimations} />;
      case 'primary': return <LevelTab level="primary" levelName="Primaria" data={d} color={Colors.levelPrimary} loading={loading} skipAnimations={skipAnimations} />;
      case 'pre': return <LevelTab level="pre" levelName="Preescolar" data={d} color={Colors.levelPre} loading={loading} skipAnimations={skipAnimations} />;
      case 'students': return <StudentsTab data={d} loading={loading} skipAnimations={skipAnimations} />;
      case 'professors': return <ProfessorsTab data={d} loading={loading} skipAnimations={skipAnimations} />;
      case 'evaluations': return <EvaluationsTab data={d} loading={loading} skipAnimations={skipAnimations} />;
      default: return null;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Head><title>{yearName} - Dashboard</title></Head>
      <View style={styles.container}>
        {/* Modern Header with Glassmorphism */}
        <LinearGradient
          colors={[Colors.primary, '#1e3a8a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          {/* Background Texture/Pattern */}
          <View style={styles.headerPattern} />

          <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
            <View style={styles.headerTop}>
              <GlassButton onPress={openDrawer}>
                <Ionicons name="menu" size={24} color="#fff" />
              </GlassButton>

              <View style={styles.headerCenter}>
                <Text style={styles.yearName}>{yearName}</Text>
                {d?.schoolYear?.state && (
                  <AnimatedBadge
                    value={d.schoolYear.state === 'active' ? 'En Curso' : d.schoolYear.state === 'finished' ? 'Finalizado' : 'Borrador'}
                    color={d.schoolYear.state === 'active' ? '#34d399' : '#9ca3af'}
                    pulse={d.schoolYear.state === 'active'}
                  />
                )}
              </View>

              <TouchableOpacity>
                <UserAvatar imageUrl={user.imageUrl} size={42} iconColor={Colors.primary} borderRadius={14} />
              </TouchableOpacity>
            </View>

            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.greeting}>Hola, {user.fullName?.split(' ')[0] || 'Admin'}</Text>
                <Text style={styles.subtitle}>Panel de Administración Académica</Text>
              </View>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</Text>
              </View>
            </View>
            {/* Lapsos Timeline - Matches Odoo's lapsos_timeline widget */}
            {d?.schoolYear?.state !== 'draft' && (
              <Animated.View style={{
                height: timelineHeight,
                opacity: timelineOpacity,
                transform: [{ translateY: timelineTranslateY }],
                marginTop: timelineMargin,
                overflow: 'hidden'
              }}>
                {loading || !d || forceSkeletons ? (
                  <LapsosTimelineSkeleton />
                ) : (
                  <LapsosTimeline
                    currentLapso={d?.schoolYear?.currentLapso || '1'}
                    state={d?.schoolYear?.state || 'active'}
                    startDate={d?.schoolYear?.startDateReal}
                    endDate={d?.schoolYear?.endDateReal}
                  />
                )}
              </Animated.View>
            )}

            {/* DEBUG: Toggle Skeleton Button */}
            {/* <TouchableOpacity
              onPress={() => setForceSkeletons(!forceSkeletons)}
              style={{ padding: 4, backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'center', borderRadius: 8, marginTop: 4, marginBottom: -4 }}
            >
              <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>
                {forceSkeletons ? '🔴 Hide Skeleton' : '🟢 Show Skeleton'}
              </Text>
            </TouchableOpacity> */}
          </Animated.View>
        </LinearGradient>

        <View style={styles.mainContainer}>
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
              {DASHBOARD_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tab, isActive && styles.tabActive]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={18}
                      color={isActive ? Colors.primary : Colors.textSecondary}
                      style={isActive ? styles.activeIcon : {}}
                    />
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Content Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
            scrollEventThrottle={16}
          >
            <View style={styles.contentInner}>
              {isOfflineMode && (
                <View style={styles.offlineBanner}>
                  <Ionicons name="cloud-offline" size={20} color="#fff" />
                  <Text style={styles.offlineText}>Modo sin conexión detectado</Text>
                </View>
              )}

              <TabTransition activeTab={activeTab}>
                {renderTabContent()}
              </TabTransition>

              {/* Enhanced Footer */}
              <View style={styles.footer}>
                <View style={styles.sessionInfo}>
                  <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.sessionText}>Sesión activa: {sessionTimeRemaining}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <Text style={styles.logoutText}>Cerrar Sesión</Text>
                  <Ionicons name="log-out-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={styles.versionText}>v2.5.0 • School Management</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaProvider >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },

  // Header
  header: {
    // paddingTop: Platform.OS === 'android' ? 44 : 54, // Reduced top padding
    paddingBottom: 10,
    borderBottomLeftRadius: 24, // Slightly smaller radius
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    zIndex: 1,
  },
  headerPattern: {
    zIndex: 1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
    backgroundColor: Colors.primary,
  },
  headerContent: { paddingHorizontal: 16, zIndex: 1 }, // Reduced horizontal padding
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, zIndex: 1 },
  headerCenter: { alignItems: 'center', flex: 1, zIndex: 1 },
  yearName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2, zIndex: 1 }, // Smaller year font
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, zIndex: 1 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#fff', zIndex: 1 }, // Smaller greeting font (26 -> 20)
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, zIndex: 1 },
  dateBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', zIndex: 1 },
  dateText: { fontSize: 11, fontWeight: '600', color: '#fff', zIndex: 1 },

  // Main Container & KPI overlap
  mainContainer: { flex: 1 },
  kpiRow: { flexDirection: 'row', gap: 12, zIndex: 1 },

  // Tab Navigation
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingTop: 8, // Reduced padding
    marginTop: -8, // Tighter overlap
    paddingVertical: 2, // Reduced vertical padding
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 2 }
    })
  },
  tabScroll: { paddingHorizontal: 12, gap: 4 }, // Reduced horizontal padding
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // Reduced tap padding
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    position: 'relative',
  },
  tabActive: { backgroundColor: Colors.primary + '08' },
  activeIcon: { transform: [{ scale: 1.05 }] }, // Slightly smaller scale
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary }, // Smaller tab text
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3
  },

  // Content
  content: { flex: 1 },
  contentInner: { padding: 12, paddingBottom: 100 }, // Compact content padding

  // Offline
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    padding: 10, // Compact banner
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  offlineText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  sessionText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.error + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  logoutText: { fontSize: 12, fontWeight: '700', color: Colors.error },
  versionText: { textAlign: 'center', marginTop: 12, color: Colors.textTertiary, fontSize: 10 },
});

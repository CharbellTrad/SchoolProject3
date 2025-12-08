/**
 * Pantalla de Historial de Autenticaciones con Paginación
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
    LayoutAnimation,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Pagination } from '../../components/list';
import { showAlert } from '../../components/showAlert';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services-odoo/authService';
import * as biometricOdooService from '../../services-odoo/biometricService';
type BiometricAuthLog = biometricOdooService.BiometricAuthLog;

const ITEMS_PER_PAGE = 15;

export default function AuthHistoryScreen() {
    const { user } = useAuth();
    const [authLogs, setAuthLogs] = useState<BiometricAuthLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

    /**
     * Carga el historial de autenticaciones con paginación
     */
    const loadAuthHistory = useCallback(async (page: number = 1) => {
        try {
            if (__DEV__) {
                console.log(`🔄 Cargando historial página ${page}...`);
            }

            setLoading(true);
            const offset = (page - 1) * ITEMS_PER_PAGE;

            const result = await biometricOdooService.getAuthHistory(ITEMS_PER_PAGE, offset);

            if (result.success && result.data) {
                setAuthLogs(result.data.records || []);
                setTotalRecords(result.data.total || 0);
                setCurrentPage(page);

                if (__DEV__) {
                    console.log(`✅ ${result.data.records?.length || 0} log(s) cargado(s), total: ${result.data.total}`);
                }
            } else {
                if (__DEV__) {
                    console.error('❌ Error cargando historial:', result.error);
                }
            }
        } catch (error) {
            if (__DEV__) {
                console.error('❌ Error inesperado:', error);
            }
            showAlert('Error', 'Ocurrió un error al cargar el historial');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Refresca la lista
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
        await loadAuthHistory(1);
        setRefreshing(false);
    }, [loadAuthHistory]);

    /**
     * Cambiar página
     */
    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            loadAuthHistory(page);
        }
    }, [loadAuthHistory, totalPages]);

    // Cargar al montar
    useEffect(() => {
        loadAuthHistory(1);
    }, [loadAuthHistory]);

    // Calcular estadísticas de la página actual
    const stats = {
        total: totalRecords,
        successful: authLogs.filter(l => l.success).length,
        failed: authLogs.filter(l => !l.success).length,
        activeSessions: authLogs.filter(l => l.session_active && l.success).length,
    };

    if (!user) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="light" translucent />
            <>
                <Head>
                    <title>Historial de Autenticaciones</title>
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
                                <Text style={styles.headerTitle}>Historial de Accesos</Text>
                                <Text style={styles.headerSubtitle}>
                                    {user.fullName}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.refreshButton}
                                onPress={onRefresh}
                                activeOpacity={0.7}
                                disabled={refreshing || loading}
                            >
                                <Ionicons name="refresh" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Resumen ràpido en Header */}
                        <View style={styles.quickStatsRow}>
                            <View style={styles.quickStat}>
                                <Text style={styles.quickStatValue}>{stats.total}</Text>
                                <Text style={styles.quickStatLabel}>Total</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.quickStat}>
                                <Text style={styles.quickStatValue}>{stats.activeSessions}</Text>
                                <Text style={styles.quickStatLabel}>Activas</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.quickStat}>
                                <Text style={[styles.quickStatValue, { color: '#86efac' }]}>{stats.successful}</Text>
                                <Text style={styles.quickStatLabel}>Exitosos</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.content}>
                        {/* Paginación */}
                        {totalPages > 1 && (
                            <View style={styles.paginationWrapper}>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={goToPage}
                                />
                            </View>
                        )}

                        <ScrollView
                            style={styles.listContainer}
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
                            {/* Lista de logs */}
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.loadingText}>Cargando historial...</Text>
                                </View>
                            ) : authLogs.length > 0 ? (
                                <View style={styles.logsSection}>
                                    {/* Línea de tiempo vertical */}
                                    <View style={styles.timelineLine} />

                                    {authLogs.map((log, index) => (
                                        <AuthLogCard
                                            key={log.id}
                                            log={log}
                                            isLast={index === authLogs.length - 1}
                                            onSessionEnded={() => loadAuthHistory(currentPage)}
                                        />
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconContainer}>
                                        <Ionicons name="time-outline" size={64} color={Colors.textTertiary} />
                                    </View>
                                    <Text style={styles.emptyTitle}>Sin Historial</Text>
                                    <Text style={styles.emptyText}>
                                        No hay registros de autenticación aún.
                                    </Text>
                                </View>
                            )}

                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </>
        </SafeAreaProvider>
    );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface AuthLogCardProps {
    log: BiometricAuthLog;
    isLast: boolean;
    onSessionEnded?: () => void;
}

const AuthLogCard: React.FC<AuthLogCardProps> = ({ log, isLast, onSessionEnded }) => {
    const [expanded, setExpanded] = useState(false);
    const [endingSession, setEndingSession] = useState(false);

    const toggleExpand = () => {
        if (Platform.OS === 'ios') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }
        setExpanded(!expanded);
    };

    const handleEndSession = async () => {
        const sessionId = log.session_id;

        if (!sessionId) {
            showAlert('Error', 'No se puede finalizar la sesión: ID de sesión no disponible');
            return;
        }

        const deviceName = log.device_name_direct || log.device_name || 'Desconocido';

        Alert.alert(
            'Finalizar Sesión',
            `¿Estás seguro de que deseas finalizar esta sesión activa?\n\nDispositivo: ${deviceName}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar',
                    style: 'destructive',
                    onPress: async () => {
                        setEndingSession(true);
                        try {
                            const { destroySession } = await import('../../services-odoo/biometricService');
                            const result = await destroySession(sessionId);

                            if (result.success) {
                                showAlert('Sesión Finalizada', result.message || 'La sesión se cerró exitosamente');
                                onSessionEnded?.();
                            } else {
                                // No mostrar alerta si la sesión ya expiró
                                if (!result.isSessionExpired) {
                                    showAlert('Error', result.error || 'No se pudo finalizar la sesión');
                                }
                            }
                        } catch (error: any) {
                            console.error('❌ Error finalizando sesión:', error);
                            showAlert('Error', 'No se pudo finalizar la sesión');
                        } finally {
                            setEndingSession(false);
                        }
                    },
                },
            ]
        );
    };

    const getAuthTypeLabel = (type: string): string => {
        switch (type) {
            case 'biometric': return 'Biométrica';
            case 'traditional': return 'Contraseña';
            case 'fallback': return 'PIN/Patrón';
            case 'automatic': return 'Auto-Login';
            default: return type;
        }
    };

    const getAuthTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'biometric': return 'finger-print';
            case 'traditional': return 'key';
            case 'fallback': return 'keypad';
            case 'automatic': return 'flash';
            default: return 'log-in';
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return {
                time: date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }),
                date: date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
            };
        } catch {
            return { time: '--:--', date: '--/--' };
        }
    };

    const { time, date } = formatDate(log.auth_date);
    const statusColor = log.success ? Colors.success : Colors.error;
    const deviceName = log.device_name_direct || log.device_name || 'Desconocido';
    const platform = log.device_platform_direct || log.device_platform || 'unknown';

    return (
        <View style={styles.timelineItem}>
            {/* Nodo de la línea de tiempo */}
            <View style={[styles.timelineNode, { borderColor: statusColor, backgroundColor: log.success ? '#fff' : '#fee2e2' }]}>
                <Ionicons
                    name={log.success ? "checkmark" : "close"}
                    size={12}
                    color={statusColor}
                />
            </View>

            {/* Tarjeta de Contenido */}
            <TouchableOpacity
                style={styles.logCard}
                activeOpacity={0.9}
                onPress={toggleExpand}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeText}>{time}</Text>
                        <Text style={styles.dateText}>{date}</Text>
                    </View>

                    <View style={styles.cardMainInfo}>
                        <View style={styles.infoTopRow}>
                            <View style={[styles.typeBadge, { backgroundColor: Colors.primary + '15' }]}>
                                <Ionicons name={getAuthTypeIcon(log.auth_type)} size={10} color={Colors.primary} />
                                <Text style={styles.typeBadgeText}>{getAuthTypeLabel(log.auth_type)}</Text>
                            </View>
                            {log.session_active && (
                                <View style={styles.activePill}>
                                    <View style={styles.activeDot} />
                                    <Text style={styles.activePillText}>Activa</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.deviceText} numberOfLines={1}>
                            {deviceName}
                        </Text>

                        <View style={styles.platformRow}>
                            <Ionicons
                                name={platform === 'ios' ? 'logo-apple' : platform === 'android' ? 'logo-android' : 'desktop-outline'}
                                size={12}
                                color={Colors.textSecondary}
                            />
                            <Text style={styles.platformText}>{platform.toUpperCase()}</Text>
                        </View>
                    </View>

                    <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={Colors.textTertiary}
                        style={{ marginLeft: 8 }}
                    />
                </View>

                {/* Detalles Expandibles */}
                {expanded && (
                    <View style={styles.expandedDetails}>
                        <View style={styles.divider} />

                        {!log.success && log.error_message && (
                            <View style={styles.errorBox}>
                                <Ionicons name="warning" size={16} color="#ef4444" />
                                <Text style={styles.errorText}>{log.error_message}</Text>
                            </View>
                        )}

                        <View style={styles.detailGrid}>
                            {log.ip_address && <DetailItem label="IP" value={log.ip_address} />}
                            {log.user_agent && <DetailItem label="User Agent" value={log.user_agent} compact />}
                            {log.session_id && <DetailItem label="Session ID" value={log.session_id} compact />}
                            <DetailItem label="ID Evento" value={`#${log.id}`} />
                        </View>

                        {log.notes && (
                            <View style={styles.noteBox}>
                                <Text style={styles.noteLabel}>Notas:</Text>
                                <Text style={styles.noteValue}>{log.notes}</Text>
                            </View>
                        )}

                        {log.session_ended_at && (
                            <Text style={styles.endedText}>
                                Sesión finalizada: {new Date(log.session_ended_at).toLocaleString()}
                            </Text>
                        )}

                        {/* Botón de Finalizar Sesión - ABAJO */}
                        {log.session_active && log.success && !log.session_ended_at && (
                            <TouchableOpacity
                                style={styles.endSessionButton}
                                onPress={handleEndSession}
                                disabled={endingSession}
                                activeOpacity={0.7}
                            >
                                {endingSession ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="log-out-outline" size={18} color="#fff" />
                                        <Text style={styles.endSessionButtonText}>Finalizar Sesión</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const DetailItem = ({ label, value, compact }: { label: string, value: string | number, compact?: boolean }) => (
    <TouchableOpacity
        style={[styles.detailItem, compact && { width: '100%' }]}
        onPress={() => Alert.alert(label, String(value))}
        activeOpacity={0.7}
    >
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={compact ? 2 : 1}>{value}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
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
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
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
    quickStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 16,
        padding: 12,
    },
    quickStat: {
        alignItems: 'center',
    },
    quickStatValue: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 18,
    },
    quickStatLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    verticalDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    content: {
        flex: 1,
        paddingTop: 10,
    },
    paginationWrapper: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    listContainer: {
        paddingHorizontal: 20,
    },
    logsSection: {
        position: 'relative',
        paddingLeft: 10,
    },
    timelineLine: {
        position: 'absolute',
        left: 24,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#e2e8f0',
        zIndex: -1,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    timelineNode: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 12,
        zIndex: 1,
        backgroundColor: '#fff',
    },
    logCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeBox: {
        alignItems: 'center',
        marginRight: 12,
        paddingRight: 12,
        borderRightWidth: 1,
        borderRightColor: '#f1f5f9',
    },
    timeText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    dateText: {
        fontSize: 10,
        color: Colors.textTertiary,
        fontWeight: '600',
    },
    cardMainInfo: {
        flex: 1,
    },
    infoTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primary,
    },
    activePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#dcfce7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#16a34a',
    },
    activePillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#16a34a',
    },
    deviceText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    platformRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    platformText: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    expandedDetails: {
        marginTop: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 12,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        flex: 1,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    detailItem: {
        width: '48%',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 8,
    },
    detailLabel: {
        fontSize: 10,
        color: Colors.textTertiary,
        fontWeight: '600',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    noteBox: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#fffbeb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    noteLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#d97706',
        marginBottom: 2,
    },
    noteValue: {
        fontSize: 12,
        color: '#b45309',
        fontStyle: 'italic',
    },
    endedText: {
        fontSize: 10,
        color: Colors.textTertiary,
        marginTop: 8,
        fontStyle: 'italic',
        textAlign: 'right',
    },
    endSessionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#ef4444',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginTop: 12,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    endSessionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: Colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    emptyText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
});

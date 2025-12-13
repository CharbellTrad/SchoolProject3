import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EmptyState } from '../../../../components/list';
import Colors from '../../../../constants/Colors';
import { useStudentEnrollments } from '../../../../hooks/useStudentEnrollments';
import { ENROLLMENT_STATE_COLORS, ENROLLMENT_STATE_LABELS, StudentEnrollment } from '../../../../services-odoo/studentEnrollmentService';

// Skeleton components
const SkeletonBox = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
    <View style={[{ width, height, backgroundColor: '#e2e8f0', borderRadius: 8 }, style]} />
);

const StudentCardSkeleton = ({ count = 3 }: { count?: number }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.cardSkeleton}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <SkeletonBox width={48} height={48} style={{ borderRadius: 24 }} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <SkeletonBox width="75%" height={18} />
                        <SkeletonBox width="55%" height={14} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                    <SkeletonBox width={80} height={24} style={{ borderRadius: 12 }} />
                    <SkeletonBox width={100} height={24} style={{ borderRadius: 12 }} />
                </View>
            </View>
        ))}
    </>
);

const StatsCardSkeleton = () => (
    <View style={styles.statsCardSkeleton}>
        <SkeletonBox width={140} height={20} />
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            <SkeletonBox width={70} height={28} />
            <SkeletonBox width={70} height={28} />
        </View>
    </View>
);

const SearchBarSkeleton = () => (
    <View style={styles.searchBarSkeleton}>
        <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
        <SkeletonBox width="80%" height={20} />
    </View>
);

// Student Card Component
const StudentCard = ({
    enrollment,
    index,
    onView,
    onEdit,
    onConfirm,
    isOfflineMode
}: {
    enrollment: StudentEnrollment;
    index: number;
    onView: () => void;
    onEdit: () => void;
    onConfirm: () => void;
    isOfflineMode: boolean;
}) => (
    <TouchableOpacity style={styles.card} onPress={onView} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
                <Ionicons name="school" size={24} color={Colors.primary} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{enrollment.studentName || enrollment.name}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{enrollment.sectionName}</Text>
            </View>
            <View style={styles.cardActions}>
                {enrollment.state === 'draft' && (
                    <TouchableOpacity
                        style={[styles.confirmButton, isOfflineMode && styles.disabledEditButton]}
                        onPress={(e) => {
                            e.stopPropagation();
                            if (!isOfflineMode) onConfirm();
                        }}
                        disabled={isOfflineMode}
                    >
                        <Ionicons name="checkmark" size={18} color={isOfflineMode ? '#9ca3af' : '#10b981'} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.editButton, isOfflineMode && styles.disabledEditButton]}
                    onPress={(e) => {
                        e.stopPropagation();
                        if (!isOfflineMode) onEdit();
                    }}
                    disabled={isOfflineMode}
                >
                    <Ionicons name="pencil" size={18} color={isOfflineMode ? '#9ca3af' : Colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
        <View style={styles.cardStats}>
            <View style={[styles.stateBadge, { backgroundColor: ENROLLMENT_STATE_COLORS[enrollment.state] + '20' }]}>
                <Text style={[styles.stateText, { color: ENROLLMENT_STATE_COLORS[enrollment.state] }]}>
                    {ENROLLMENT_STATE_LABELS[enrollment.state]}
                </Text>
            </View>
            <View style={styles.statBadge}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.statText}>{enrollment.yearName}</Text>
            </View>
            {enrollment.parentName && (
                <View style={styles.statBadge}>
                    <Ionicons name="people-outline" size={14} color={Colors.secondary} />
                    <Text style={styles.statText} numberOfLines={1}>{enrollment.parentName}</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
);

// Stats Card Component
const StatsCard = ({ total, countByState }: { total: number; countByState: { draft: number; done: number; cancel: number } }) => (
    <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Estudiantes del Año</Text>
        <Text style={styles.statsValue}>{total}</Text>
        <View style={styles.statsRow}>
            <View style={styles.statsItem}>
                <View style={[styles.statsDot, { backgroundColor: ENROLLMENT_STATE_COLORS.done }]} />
                <Text style={styles.statsItemText}>{countByState.done} inscritos</Text>
            </View>
            <View style={styles.statsItem}>
                <View style={[styles.statsDot, { backgroundColor: ENROLLMENT_STATE_COLORS.draft }]} />
                <Text style={styles.statsItemText}>{countByState.draft} pendientes</Text>
            </View>
            <View style={styles.statsItem}>
                <View style={[styles.statsDot, { backgroundColor: ENROLLMENT_STATE_COLORS.cancel }]} />
                <Text style={styles.statsItemText}>{countByState.cancel} retirados</Text>
            </View>
        </View>
    </View>
);

// Search Bar Component
const SearchBar = ({ value, onChangeText, onClear }: { value: string; onChangeText: (text: string) => void; onClear: () => void }) => (
    <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
            style={styles.searchInput}
            placeholder="Buscar estudiante..."
            placeholderTextColor={Colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
        />
        {value.length > 0 && (
            <TouchableOpacity onPress={onClear}>
                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
        )}
    </View>
);

export default function StudentsListScreen() {
    const {
        enrollments,
        loading,
        initialLoading,
        refreshing,
        searchQuery,
        searchMode,
        totalEnrollments,
        isOfflineMode,
        countByState,
        setSearchQuery,
        exitSearchMode,
        onRefresh,
        handleDelete,
        handleConfirm,
    } = useStudentEnrollments();

    const navigation = useNavigation();
    const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [showSkeleton, setShowSkeleton] = useState(true);

    useEffect(() => {
        if (!initialLoading && showSkeleton) {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setShowSkeleton(false);
                fadeAnim.setValue(0);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [initialLoading, showSkeleton, fadeAnim]);

    const handleView = (enrollment: StudentEnrollment) => {
        showAlert('Ver Inscripción', `${enrollment.studentName}\nSección: ${enrollment.sectionName}\nEstado: ${ENROLLMENT_STATE_LABELS[enrollment.state]}`);
    };

    const handleEdit = (enrollment: StudentEnrollment) => {
        showAlert('Editar Inscripción', 'Funcionalidad en desarrollo');
    };

    const onConfirm = async (enrollment: StudentEnrollment) => {
        try {
            await handleConfirm(enrollment.id);
            showAlert('Éxito', 'Estudiante inscrito exitosamente');
        } catch (error: any) {
            showAlert('Error', error.message || 'No se pudo confirmar la inscripción');
        }
    };

    return (
        <>
            <Head>
                <title>Estudiantes del Año</title>
            </Head>
            <SafeAreaProvider>
                <StatusBar style="light" translucent />
                <View style={styles.container}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryDark]}
                        style={styles.header}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <TouchableOpacity style={styles.menuButton} onPress={openDrawer} activeOpacity={0.7}>
                            <Ionicons name="menu" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Estudiantes del Año</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.addButton, (isOfflineMode || showSkeleton) && styles.disabledButton]}
                            onPress={() => {
                                if (isOfflineMode) {
                                    showAlert('Sin conexión', 'No puedes inscribir estudiantes sin conexión a internet.');
                                    return;
                                }
                                if (!showSkeleton) {
                                    router.push('/admin/academic-management/daily-operations/enroll-student' as any);
                                }
                            }}
                            disabled={isOfflineMode || showSkeleton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add" size={24} color={(isOfflineMode || showSkeleton) ? '#9ca3af' : '#fff'} />
                        </TouchableOpacity>
                    </LinearGradient>

                    <View style={styles.content}>
                        {showSkeleton ? (
                            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                                <StatsCardSkeleton />
                                <SearchBarSkeleton />
                                <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                                    <StudentCardSkeleton count={5} />
                                </ScrollView>
                            </Animated.View>
                        ) : (
                            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                                {isOfflineMode && (
                                    <View style={styles.offlineBanner}>
                                        <Ionicons name="cloud-offline" size={20} color="#fff" />
                                        <Text style={styles.offlineText}>Sin conexión • Mostrando datos guardados</Text>
                                    </View>
                                )}

                                {!searchMode && <StatsCard total={totalEnrollments} countByState={countByState} />}

                                <SearchBar value={searchQuery} onChangeText={setSearchQuery} onClear={exitSearchMode} />

                                <ScrollView
                                    style={styles.listContainer}
                                    showsVerticalScrollIndicator={false}
                                    removeClippedSubviews={true}
                                    contentContainerStyle={styles.listContent}
                                    refreshControl={
                                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                                    }
                                >
                                    {enrollments.length === 0 ? (
                                        loading ? (
                                            <StudentCardSkeleton count={5} />
                                        ) : (
                                            <EmptyState hasSearchQuery={searchMode && searchQuery.trim().length >= 3} entityName="inscripciones" />
                                        )
                                    ) : (
                                        enrollments.map((enrollment, index) => (
                                            <StudentCard
                                                key={enrollment.id}
                                                enrollment={enrollment}
                                                index={index}
                                                onView={() => handleView(enrollment)}
                                                onEdit={() => handleEdit(enrollment)}
                                                onConfirm={() => onConfirm(enrollment)}
                                                isOfflineMode={isOfflineMode}
                                            />
                                        ))
                                    )}
                                    <View style={{ height: 120 }} />
                                </ScrollView>
                            </Animated.View>
                        )}
                    </View>
                </View>
            </SafeAreaProvider>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? 60 : 70, paddingBottom: 24, paddingHorizontal: 20,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    },
    menuButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
    addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    disabledButton: { opacity: 0.5 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    offlineBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f59e0b', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, marginBottom: 20, gap: 10 },
    offlineText: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
    listContainer: { flex: 1 },
    listContent: { paddingBottom: 20 },
    statsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    statsLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
    statsValue: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginTop: 4 },
    statsRow: { flexDirection: 'row', marginTop: 12, gap: 16 },
    statsItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statsDot: { width: 8, height: 8, borderRadius: 4 },
    statsItemText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
    statsCardSkeleton: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
    searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
    searchBarSkeleton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    cardSkeleton: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight + '20', justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    cardActions: { flexDirection: 'row', gap: 8 },
    editButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryLight + '20', justifyContent: 'center', alignItems: 'center' },
    confirmButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#10b98120', justifyContent: 'center', alignItems: 'center' },
    disabledEditButton: { backgroundColor: '#f1f5f9' },
    cardStats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
    stateBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    stateText: { fontSize: 12, fontWeight: '700' },
    statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
    statText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', maxWidth: 100 },
});

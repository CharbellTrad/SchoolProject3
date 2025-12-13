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
import { useEvaluations } from '../../../../hooks/useEvaluations';
import { Evaluation, EVALUATION_STATE_COLORS, EVALUATION_STATE_LABELS } from '../../../../services-odoo/evaluationService';

// Skeleton components
const SkeletonBox = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
    <View style={[{ width, height, backgroundColor: '#e2e8f0', borderRadius: 8 }, style]} />
);

const EvaluationCardSkeleton = ({ count = 3 }: { count?: number }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.cardSkeleton}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <SkeletonBox width={48} height={48} style={{ borderRadius: 12 }} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <SkeletonBox width="80%" height={18} />
                        <SkeletonBox width="60%" height={14} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                    <SkeletonBox width={100} height={24} style={{ borderRadius: 12 }} />
                    <SkeletonBox width={80} height={24} style={{ borderRadius: 12 }} />
                </View>
            </View>
        ))}
    </>
);

const StatsCardSkeleton = () => (
    <View style={styles.statsCardSkeleton}>
        <SkeletonBox width={140} height={20} />
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
            <SkeletonBox width={60} height={28} />
            <SkeletonBox width={60} height={28} />
            <SkeletonBox width={60} height={28} />
        </View>
    </View>
);

const SearchBarSkeleton = () => (
    <View style={styles.searchBarSkeleton}>
        <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
        <SkeletonBox width="80%" height={20} />
    </View>
);

// Evaluation Card Component
const EvaluationCard = ({
    evaluation,
    index,
    onView,
    onEdit,
    isOfflineMode
}: {
    evaluation: Evaluation;
    index: number;
    onView: () => void;
    onEdit: () => void;
    isOfflineMode: boolean;
}) => (
    <TouchableOpacity style={styles.card} onPress={onView} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: EVALUATION_STATE_COLORS[evaluation.state] + '20' }]}>
                <Ionicons name="clipboard" size={24} color={EVALUATION_STATE_COLORS[evaluation.state]} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{evaluation.name}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {evaluation.professorName} • {evaluation.sectionName}
                </Text>
            </View>
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
        <View style={styles.cardStats}>
            <View style={[styles.stateBadge, { backgroundColor: EVALUATION_STATE_COLORS[evaluation.state] + '20' }]}>
                <Text style={[styles.stateText, { color: EVALUATION_STATE_COLORS[evaluation.state] }]}>
                    {EVALUATION_STATE_LABELS[evaluation.state]}
                </Text>
            </View>
            <View style={styles.statBadge}>
                <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.statText}>{evaluation.evaluationDate}</Text>
            </View>
            {evaluation.subjectName && (
                <View style={styles.statBadge}>
                    <Ionicons name="book-outline" size={14} color={Colors.primary} />
                    <Text style={styles.statText} numberOfLines={1}>{evaluation.subjectName}</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
);

// Stats Card Component
const StatsCard = ({ total, countByState }: { total: number; countByState: { all: number; partial: number; draft: number } }) => (
    <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Evaluaciones en Curso</Text>
        <Text style={styles.statsValue}>{total}</Text>
        <View style={styles.statsRow}>
            <View style={styles.statsItem}>
                <View style={[styles.statsDot, { backgroundColor: EVALUATION_STATE_COLORS.all }]} />
                <Text style={styles.statsItemText}>{countByState.all} calificadas</Text>
            </View>
            <View style={styles.statsItem}>
                <View style={[styles.statsDot, { backgroundColor: EVALUATION_STATE_COLORS.partial }]} />
                <Text style={styles.statsItemText}>{countByState.partial} parciales</Text>
            </View>
            <View style={styles.statsItem}>
                <View style={[styles.statsDot, { backgroundColor: EVALUATION_STATE_COLORS.draft }]} />
                <Text style={styles.statsItemText}>{countByState.draft} pendientes</Text>
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
            placeholder="Buscar evaluación..."
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

export default function EvaluationsListScreen() {
    const {
        evaluations,
        loading,
        initialLoading,
        refreshing,
        searchQuery,
        searchMode,
        totalEvaluations,
        isOfflineMode,
        countByState,
        setSearchQuery,
        exitSearchMode,
        onRefresh,
        handleDelete,
    } = useEvaluations();

    const navigation = useNavigation();
    const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
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

    const handleView = (evaluation: Evaluation) => {
        setSelectedEvaluation(evaluation);
        showAlert('Ver Evaluación', `${evaluation.name}\nProfesor: ${evaluation.professorName}\nSección: ${evaluation.sectionName}`);
    };

    const handleEdit = (evaluation: Evaluation) => {
        setSelectedEvaluation(evaluation);
        showAlert('Editar Evaluación', 'Funcionalidad en desarrollo');
    };

    return (
        <>
            <Head>
                <title>Evaluaciones en Curso</title>
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
                            <Text style={styles.headerTitle}>Evaluaciones</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.addButton, (isOfflineMode || showSkeleton) && styles.disabledButton]}
                            onPress={() => {
                                if (isOfflineMode) {
                                    showAlert('Sin conexión', 'No puedes crear evaluaciones sin conexión a internet.');
                                    return;
                                }
                                if (!showSkeleton) {
                                    router.push('/admin/academic-management/daily-operations/register-evaluation' as any);
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
                                    <EvaluationCardSkeleton count={5} />
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

                                {!searchMode && <StatsCard total={totalEvaluations} countByState={countByState} />}

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
                                    {evaluations.length === 0 ? (
                                        loading ? (
                                            <EvaluationCardSkeleton count={5} />
                                        ) : (
                                            <EmptyState hasSearchQuery={searchMode && searchQuery.trim().length >= 3} entityName="evaluaciones" />
                                        )
                                    ) : (
                                        evaluations.map((evaluation, index) => (
                                            <EvaluationCard
                                                key={evaluation.id}
                                                evaluation={evaluation}
                                                index={index}
                                                onView={() => handleView(evaluation)}
                                                onEdit={() => handleEdit(evaluation)}
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
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 } }),
    },
    menuButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
    addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    disabledButton: { opacity: 0.5 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    offlineBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f59e0b', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, marginBottom: 20, gap: 10 },
    offlineText: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1, letterSpacing: 0.2 },
    listContainer: { flex: 1 },
    listContent: { paddingBottom: 20 },
    // Stats Card
    statsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    statsLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
    statsValue: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginTop: 4 },
    statsRow: { flexDirection: 'row', marginTop: 12, gap: 16 },
    statsItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statsDot: { width: 8, height: 8, borderRadius: 4 },
    statsItemText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
    statsCardSkeleton: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    // Search Bar
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
    searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
    searchBarSkeleton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
    // Card
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    cardSkeleton: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    editButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryLight + '20', justifyContent: 'center', alignItems: 'center' },
    disabledEditButton: { backgroundColor: '#f1f5f9' },
    cardStats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
    stateBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    stateText: { fontSize: 12, fontWeight: '700' },
    statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
    statText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', maxWidth: 100 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
    emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.backgroundTertiary, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12, letterSpacing: -0.3 },
    emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
});

import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EditEnrolledSectionModal, ViewEnrolledSectionModal } from '../../../../components/enrolledSection';
import { EmptyState, Pagination, PaginationSkeleton } from '../../../../components/list';
import { SectionFilters, SectionFiltersSkeleton } from '../../../../components/section';
import Colors from '../../../../constants/Colors';
import { useEnrolledSections } from '../../../../hooks/useEnrolledSections';
import { EnrolledSection, SECTION_TYPE_COLORS, SECTION_TYPE_LABELS } from '../../../../services-odoo/enrolledSectionService';

type SectionType = 'pre' | 'primary' | 'secundary';

// Animated Skeleton Box with shimmer effect
const AnimatedSkeletonBox = ({ width, height, style }: { width: number | string; height: number; style?: any }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            })
        ).start();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.4, 0.7, 0.4],
    });

    return (
        <Animated.View
            style={[
                { width, height, backgroundColor: '#e2e8f0', borderRadius: 8, opacity },
                style
            ]}
        />
    );
};

const SectionCardSkeleton = ({ count = 3 }: { count?: number }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.card}>
                {/* Left accent bar */}
                <AnimatedSkeletonBox width={4} height={50} style={{ borderRadius: 0 }} />

                {/* Content */}
                <View style={styles.cardContent}>
                    {/* Header Row: Name + Badge */}
                    <View style={styles.cardHeader}>
                        <AnimatedSkeletonBox width="55%" height={16} style={{ flex: 1 }} />
                        <AnimatedSkeletonBox width={100} height={20} style={{ borderRadius: 8 }} />
                    </View>
                    {/* Stats Row with icons */}
                    <View style={styles.cardStats}>
                        <View style={styles.statItem}>
                            <AnimatedSkeletonBox width={24} height={24} style={{ borderRadius: 6 }} />
                            <AnimatedSkeletonBox width={20} height={14} />
                            <AnimatedSkeletonBox width={22} height={12} />
                        </View>
                        <View style={styles.statItem}>
                            <AnimatedSkeletonBox width={24} height={24} style={{ borderRadius: 6 }} />
                            <AnimatedSkeletonBox width={16} height={14} />
                            <AnimatedSkeletonBox width={26} height={12} />
                        </View>
                    </View>
                </View>
                {/* Actions - horizontal */}
                <View style={styles.actions}>
                    <AnimatedSkeletonBox width={36} height={36} style={{ borderRadius: 10 }} />
                    <AnimatedSkeletonBox width={36} height={36} style={{ borderRadius: 10 }} />
                </View>
            </View>
        ))}
    </>
);

const StatsCardSkeleton = () => (
    <View style={[styles.statsCardSkeleton, { alignItems: 'center' }]}>
        <AnimatedSkeletonBox width={60} height={36} style={{ borderRadius: 8 }} />
        <AnimatedSkeletonBox width={130} height={16} style={{ marginTop: 6, borderRadius: 4 }} />
    </View>
);

const SearchBarSkeleton = () => (
    <View style={styles.searchBarSkeleton}>
        <AnimatedSkeletonBox width={20} height={20} style={{ borderRadius: 10 }} />
        <AnimatedSkeletonBox width="70%" height={18} style={{ borderRadius: 4 }} />
    </View>
);

// Section Card Component - Enhanced visual design
const SectionCard = ({
    section,
    onView,
    onEdit,
    isOfflineMode
}: {
    section: EnrolledSection;
    onView: () => void;
    onEdit: () => void;
    isOfflineMode: boolean;
}) => {
    const typeColor = SECTION_TYPE_COLORS[section.type];

    return (
        <View style={styles.card}>
            {/* Left accent border */}
            <View style={[styles.cardAccent, { backgroundColor: typeColor }]} />

            {/* Content */}
            <View style={styles.cardContent}>
                {/* Name + Badge Row */}
                <View style={styles.cardHeader}>
                    <Text style={styles.cardName} numberOfLines={1}>{section.sectionName}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: typeColor + '15' }]}>
                        <Text style={[styles.typeText, { color: typeColor }]}>
                            {SECTION_TYPE_LABELS[section.type]}
                        </Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.cardStats}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: Colors.primary + '12' }]}>
                            <Ionicons name="people" size={14} color={Colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{section.studentsCount}</Text>
                        <Text style={styles.statLabel}>est.</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: Colors.secondaryLight + '12' }]}>
                            <Ionicons name="person" size={14} color={Colors.secondaryLight} />
                        </View>
                        <Text style={styles.statValue}>{section.professorsCount}</Text>
                        <Text style={styles.statLabel}>prof.</Text>
                    </View>
                    {section.type === 'secundary' && (
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#10b981' + '12' }]}>
                                <Ionicons name="book" size={14} color="#10b981" />
                            </View>
                            <Text style={styles.statValue}>{section.subjectsCount}</Text>
                            <Text style={styles.statLabel}>mat.</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Actions Row */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.viewBtn, isOfflineMode && styles.btnDisabled]}
                    onPress={(e) => {
                        e.stopPropagation();
                        onView();
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="eye-outline" size={18} color={isOfflineMode ? '#9ca3af' : Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn, isOfflineMode && styles.btnDisabled]}
                    onPress={(e) => {
                        e.stopPropagation();
                        if (!isOfflineMode) onEdit();
                    }}
                    disabled={isOfflineMode}
                    activeOpacity={0.7}
                >
                    <Ionicons name="create-outline" size={18} color={isOfflineMode ? '#9ca3af' : Colors.secondary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Stats Card Component - Selectable
const StatsCard = ({
    total,
    countByType,
    isSelected,
    onPress
}: {
    total: number;
    countByType: { pre: number; primary: number; secundary: number };
    isSelected?: boolean;
    onPress?: () => void;
}) => (
    <TouchableOpacity
        style={[styles.statsCard, isSelected && styles.statsCardSelected]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={styles.statsValue}>{total}</Text>
        <Text style={styles.statsLabel}>Secciones Activas</Text>
    </TouchableOpacity>
);

// Search Bar Component
const SearchBar = ({ value, onChangeText, onClear }: { value: string; onChangeText: (text: string) => void; onClear: () => void }) => (
    <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
            style={styles.searchInput}
            placeholder="Buscar sección..."
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

export default function SectionsListScreen() {
    const {
        sections,
        loading,
        initialLoading,
        refreshing,
        searchQuery,
        searchMode,
        totalSections,
        isOfflineMode,
        countByType,
        currentPage,
        totalPages,
        setSearchQuery,
        exitSearchMode,
        loadPage,
        loadCounts,
        onRefresh,
        handleDelete,
    } = useEnrolledSections();

    const navigation = useNavigation();
    const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

    const [selectedFilter, setSelectedFilter] = useState<SectionType | 'all'>('all');
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [showSkeleton, setShowSkeleton] = useState(true);
    const scrollRef = useRef<ScrollView>(null);

    // Modal state
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedSection, setSelectedSection] = useState<EnrolledSection | null>(null);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            // Reset to page 1 with all filter
            setSelectedFilter('all');
            setShowSkeleton(true);
            fadeAnim.setValue(1);
            scrollRef.current?.scrollTo({ y: 0, animated: false });
            // Load counts and page 1 with 'all' filter
            loadCounts();
            loadPage(1, 'all');
        }, [loadCounts, loadPage]) // eslint-disable-line react-hooks/exhaustive-deps
    );

    // Show sections directly (server handles pagination and filtering)
    const filteredSections = sections;

    // Handle filter change - load from server
    const handleFilterChange = useCallback((filter: SectionType | 'all') => {
        setSelectedFilter(filter);
        loadPage(1, filter);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, [loadPage]);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        loadPage(page, selectedFilter);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, [loadPage, selectedFilter]);

    useEffect(() => {
        // Hide skeleton when loading finishes (either initial or refresh)
        if (!initialLoading && !refreshing && showSkeleton) {
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
    }, [initialLoading, refreshing, showSkeleton, fadeAnim]);

    const handleView = (section: EnrolledSection) => {
        setSelectedSection(section);
        setViewModalVisible(true);
    };

    const handleEdit = (section: EnrolledSection) => {
        setSelectedSection(section);
        setEditModalVisible(true);
    };

    const handleModalSave = () => {
        onRefresh();
    };

    return (
        <>
            <Head>
                <title>Secciones Activas</title>
            </Head>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
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
                                    <Text style={styles.headerTitle}>Secciones Activas</Text>
                                    {sections.length > 0 && (
                                        <Text style={styles.headerSubtitle}>{sections[0].yearName}</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[styles.addButton, (isOfflineMode || showSkeleton) && styles.disabledButton]}
                                    onPress={() => {
                                        if (isOfflineMode) {
                                            showAlert('Sin conexión', 'No puedes inscribir secciones sin conexión a internet.');
                                            return;
                                        }
                                        if (!showSkeleton) {
                                            router.push('/admin/academic-management/daily-operations/enroll-section' as any);
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
                                        <SectionFiltersSkeleton />
                                        <SearchBarSkeleton />
                                        <PaginationSkeleton />
                                        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                                            <SectionCardSkeleton count={5} />
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

                                        {!searchMode && (
                                            <>
                                                <StatsCard
                                                    total={totalSections}
                                                    countByType={countByType}
                                                    isSelected={selectedFilter === 'all'}
                                                    onPress={() => handleFilterChange('all')}
                                                />
                                                <SectionFilters
                                                    countByType={countByType}
                                                    selectedFilter={selectedFilter}
                                                    onFilterChange={handleFilterChange}
                                                />
                                            </>
                                        )}

                                        <SearchBar value={searchQuery} onChangeText={setSearchQuery} onClear={exitSearchMode} />

                                        {!searchMode && totalPages > 1 && (
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                onPageChange={handlePageChange}
                                            />
                                        )}

                                        <ScrollView
                                            ref={scrollRef}
                                            style={styles.listContainer}
                                            showsVerticalScrollIndicator={false}
                                            removeClippedSubviews={true}
                                            contentContainerStyle={styles.listContent}
                                            refreshControl={
                                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
                                            }
                                        >
                                            {loading ? (
                                                <SectionCardSkeleton count={5} />
                                            ) : filteredSections.length === 0 ? (
                                                searchMode ? (
                                                    <EmptyState hasSearchQuery={searchQuery.trim().length >= 3} entityName="secciones" />
                                                ) : selectedFilter !== 'all' ? (
                                                    <EmptyState hasSearchQuery={false} entityName={`secciones de ${SECTION_TYPE_LABELS[selectedFilter]}`} />
                                                ) : (
                                                    <EmptyState hasSearchQuery={false} entityName="secciones" />
                                                )
                                            ) : (
                                                filteredSections.map((section) => (
                                                    <SectionCard
                                                        key={section.id}
                                                        section={section}
                                                        onView={() => handleView(section)}
                                                        onEdit={() => handleEdit(section)}
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

                        {/* Modals */}
                        <ViewEnrolledSectionModal
                            visible={viewModalVisible}
                            section={selectedSection}
                            onClose={() => setViewModalVisible(false)}
                            onEdit={() => {
                                setViewModalVisible(false);
                                setEditModalVisible(true);
                            }}
                            isOfflineMode={isOfflineMode}
                        />

                        <EditEnrolledSectionModal
                            visible={editModalVisible}
                            section={selectedSection}
                            availableProfessors={[]} // TODO: fetch from professorService
                            onClose={() => setEditModalVisible(false)}
                            onSave={handleModalSave}
                        />
                    </SafeAreaProvider>
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
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
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
    addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    disabledButton: { opacity: 0.5 },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    offlineBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f59e0b', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 16, marginBottom: 20, gap: 10 },
    offlineText: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
    listContainer: { flex: 1 },
    listContent: { paddingBottom: 20 },
    statsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
    statsCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
    statsLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
    statsValue: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginTop: 4 },
    statsRow: { flexDirection: 'row', marginTop: 12, gap: 16 },
    statsItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statsDot: { width: 8, height: 8, borderRadius: 4 },
    statsItemText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
    statsCardSkeleton: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: Colors.border },
    searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
    searchBarSkeleton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: Colors.border },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        paddingLeft: 0,
        marginBottom: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    cardAccent: {
        width: 4,
        height: '100%',
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
    },
    cardIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardSkeleton: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
    cardContent: { flex: 1, gap: 6 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeBar: { width: 4, height: 20, borderRadius: 2 },
    cardName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    typeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
    cardStats: { flexDirection: 'row', gap: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '700' },
    statLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    viewBtn: { backgroundColor: Colors.primary + '12' },
    editBtn: { backgroundColor: Colors.secondaryLight + '15' },
    btnDisabled: { backgroundColor: '#f1f5f9', opacity: 0.5 },
});

import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EditEnrolledSectionModal, ViewEnrolledSectionModal } from '../../../../components/enrolledSection';
import { EmptyState } from '../../../../components/list';
import { SectionFilters, SectionFiltersSkeleton } from '../../../../components/section';
import Colors from '../../../../constants/Colors';
import { useEnrolledSections } from '../../../../hooks/useEnrolledSections';
import { EnrolledSection, SECTION_TYPE_COLORS, SECTION_TYPE_LABELS } from '../../../../services-odoo/enrolledSectionService';

type SectionType = 'pre' | 'primary' | 'secundary';

// Skeleton components
const SkeletonBox = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
    <View style={[{ width, height, backgroundColor: '#e2e8f0', borderRadius: 8 }, style]} />
);

const SectionCardSkeleton = ({ count = 3 }: { count?: number }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.card}>
                {/* Content */}
                <View style={styles.cardContent}>
                    {/* Title Row: Color bar + Name + Badge */}
                    <View style={styles.cardTitleRow}>
                        <SkeletonBox width={4} height={20} style={{ borderRadius: 2 }} />
                        <SkeletonBox width="60%" height={18} />
                        <SkeletonBox width={60} height={22} style={{ borderRadius: 6 }} />
                    </View>
                    {/* Stats Row */}
                    <View style={[styles.cardStats, { marginTop: 10 }]}>
                        <SkeletonBox width={50} height={18} />
                        <SkeletonBox width={50} height={18} />
                    </View>
                </View>
                {/* Actions - View & Edit buttons */}
                <View style={styles.actions}>
                    <SkeletonBox width={34} height={34} style={{ borderRadius: 10 }} />
                    <SkeletonBox width={34} height={34} style={{ borderRadius: 10 }} />
                </View>
            </View>
        ))}
    </>
);

const StatsCardSkeleton = () => (
    <View style={styles.statsCardSkeleton}>
        <SkeletonBox width={50} height={32} />
        <SkeletonBox width={120} height={16} style={{ marginTop: 4 }} />
    </View>
);

const SearchBarSkeleton = () => (
    <View style={styles.searchBarSkeleton}>
        <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
        <SkeletonBox width="80%" height={20} />
    </View>
);

// Section Card Component - StudentCard-style layout
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
}) => (
    <TouchableOpacity style={styles.card} onPress={onView} activeOpacity={0.7}>
        <View style={styles.cardContent}>
            {/* Title Row: Color Bar + Name + Type Badge */}
            <View style={styles.cardTitleRow}>
                <View style={[styles.typeBar, { backgroundColor: SECTION_TYPE_COLORS[section.type] }]} />
                <Text style={styles.cardName} numberOfLines={1}>{section.sectionName}</Text>
                <View style={[styles.typeBadge, { backgroundColor: SECTION_TYPE_COLORS[section.type] + '20' }]}>
                    <Text style={[styles.typeText, { color: SECTION_TYPE_COLORS[section.type] }]}>
                        {SECTION_TYPE_LABELS[section.type]}
                    </Text>
                </View>
            </View>

            {/* Stats Row - Indented to not align under color bar */}
            <View style={styles.cardStats}>
                <View style={styles.statItem}>
                    <Ionicons name="people" size={18} color={Colors.primary} />
                    <Text style={styles.statValue}>{section.studentsCount}</Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="person" size={18} color={Colors.secondary} />
                    <Text style={styles.statValue}>{section.professorsCount}</Text>
                </View>
                {section.type === 'secundary' && (
                    <View style={styles.statItem}>
                        <Ionicons name="book" size={18} color="#10b981" />
                        <Text style={styles.statValue}>{section.subjectsCount}</Text>
                    </View>
                )}
            </View>
        </View>

        {/* Actions Column - View & Edit */}
        <View style={styles.actions}>
            <TouchableOpacity
                style={[styles.viewBtn, isOfflineMode && styles.btnDisabled]}
                onPress={(e) => {
                    e.stopPropagation();
                    onView();
                }}
                activeOpacity={0.7}
            >
                <Ionicons name="eye-outline" size={18} color={isOfflineMode ? '#9ca3af' : Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.editBtn, isOfflineMode && styles.btnDisabled]}
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
    </TouchableOpacity>
);

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
        setSearchQuery,
        exitSearchMode,
        onRefresh,
        handleDelete,
    } = useEnrolledSections();

    const navigation = useNavigation();
    const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

    const [selectedFilter, setSelectedFilter] = useState<SectionType | 'all'>('all');
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [showSkeleton, setShowSkeleton] = useState(true);

    // Modal state
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedSection, setSelectedSection] = useState<EnrolledSection | null>(null);

    // Filter sections by type
    const filteredSections = useMemo(() => {
        if (selectedFilter === 'all') return sections;
        return sections.filter(s => s.type === selectedFilter);
    }, [sections, selectedFilter]);

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
                                                    onPress={() => setSelectedFilter('all')}
                                                />
                                                <SectionFilters
                                                    countByType={countByType}
                                                    selectedFilter={selectedFilter}
                                                    onFilterChange={setSelectedFilter}
                                                />
                                            </>
                                        )}

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
                                            {filteredSections.length === 0 ? (
                                                loading ? (
                                                    <SectionCardSkeleton count={5} />
                                                ) : selectedFilter !== 'all' ? (
                                                    <EmptyState hasSearchQuery={false} entityName={`secciones de ${SECTION_TYPE_LABELS[selectedFilter]}`} />
                                                ) : (
                                                    <EmptyState hasSearchQuery={searchMode && searchQuery.trim().length >= 3} entityName="secciones" />
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
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
    searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
    searchBarSkeleton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: Colors.border },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, gap: 14, borderWidth: 1, borderColor: Colors.border },
    cardSkeleton: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    cardContent: { flex: 1 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeBar: { width: 4, height: 20, borderRadius: 2 },
    cardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    typeText: { fontSize: 11, fontWeight: '700' },
    cardStats: { flexDirection: 'row', marginTop: 10, marginLeft: 12, gap: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statValue: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    viewBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primary + '12', justifyContent: 'center', alignItems: 'center' },
    editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.secondaryLight + '15', justifyContent: 'center', alignItems: 'center' },
    btnDisabled: { backgroundColor: '#f1f5f9', opacity: 0.5 },
});

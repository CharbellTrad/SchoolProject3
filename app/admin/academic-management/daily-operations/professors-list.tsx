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
import { useProfessors } from '../../../../hooks/useProfessors';
import { Professor } from '../../../../services-odoo/professorService';

// Skeleton components
const SkeletonBox = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
    <View style={[{ width, height, backgroundColor: '#e2e8f0', borderRadius: 8 }, style]} />
);

const ProfessorCardSkeleton = ({ count = 3 }: { count?: number }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.cardSkeleton}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <SkeletonBox width={48} height={48} style={{ borderRadius: 24 }} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <SkeletonBox width="70%" height={18} />
                        <SkeletonBox width="50%" height={14} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                    <SkeletonBox width={80} height={24} style={{ borderRadius: 12 }} />
                    <SkeletonBox width={80} height={24} style={{ borderRadius: 12 }} />
                </View>
            </View>
        ))}
    </>
);

const StatsCardSkeleton = () => (
    <View style={styles.statsCardSkeleton}>
        <SkeletonBox width={120} height={20} />
        <SkeletonBox width={60} height={32} style={{ marginTop: 8 }} />
    </View>
);

const SearchBarSkeleton = () => (
    <View style={styles.searchBarSkeleton}>
        <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
        <SkeletonBox width="80%" height={20} />
    </View>
);

// Professor Card Component
const ProfessorCard = ({
    professor,
    index,
    onView,
    onEdit,
    isOfflineMode
}: {
    professor: Professor;
    index: number;
    onView: () => void;
    onEdit: () => void;
    isOfflineMode: boolean;
}) => (
    <TouchableOpacity style={styles.card} onPress={onView} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
                <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{professor.professorName || professor.name}</Text>
                <Text style={styles.cardYear} numberOfLines={1}>{professor.yearName}</Text>
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
            <View style={styles.statBadge}>
                <Ionicons name="book-outline" size={14} color={Colors.primary} />
                <Text style={styles.statText}>{professor.subjectsCount} materias</Text>
            </View>
            <View style={styles.statBadge}>
                <Ionicons name="grid-outline" size={14} color={Colors.secondary} />
                <Text style={styles.statText}>{professor.sectionsCount} secciones</Text>
            </View>
        </View>
    </TouchableOpacity>
);

// Stats Card Component
const StatsCard = ({ total }: { total: number }) => (
    <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Docentes Asignados</Text>
        <Text style={styles.statsValue}>{total}</Text>
        <Text style={styles.statsSubtitle}>Año escolar actual</Text>
    </View>
);

// Search Bar Component
const SearchBar = ({
    value,
    onChangeText,
    onClear
}: {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
}) => (
    <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
            style={styles.searchInput}
            placeholder="Buscar profesor..."
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

export default function ProfessorsListScreen() {
    const {
        professors,
        loading,
        initialLoading,
        refreshing,
        searchQuery,
        searchMode,
        totalProfessors,
        isOfflineMode,
        setSearchQuery,
        exitSearchMode,
        onRefresh,
        handleDelete,
    } = useProfessors();

    const navigation = useNavigation();
    const openDrawer = () => navigation.dispatch(DrawerActions.openDrawer());

    const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
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

    const handleView = (professor: Professor) => {
        setSelectedProfessor(professor);
        // TODO: Show view modal
        showAlert('Ver Profesor', `${professor.professorName}\n${professor.sectionsCount} secciones asignadas`);
    };

    const handleEdit = (professor: Professor) => {
        setSelectedProfessor(professor);
        // TODO: Show edit modal
        showAlert('Editar Profesor', 'Funcionalidad en desarrollo');
    };

    return (
        <>
            <Head>
                <title>Docentes Asignados</title>
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
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={openDrawer}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="menu" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Docentes Asignados</Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.addButton,
                                (isOfflineMode || showSkeleton) && styles.disabledButton,
                            ]}
                            onPress={() => {
                                if (isOfflineMode) {
                                    showAlert(
                                        'Sin conexión',
                                        'No puedes asignar docentes sin conexión a internet.'
                                    );
                                    return;
                                }
                                if (!showSkeleton) {
                                    router.push('/admin/academic-management/daily-operations/register-professor' as any);
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
                                <ScrollView
                                    style={styles.listContainer}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.listContent}
                                >
                                    <ProfessorCardSkeleton count={5} />
                                </ScrollView>
                            </Animated.View>
                        ) : (
                            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                                {isOfflineMode && (
                                    <View style={styles.offlineBanner}>
                                        <Ionicons name="cloud-offline" size={20} color="#fff" />
                                        <Text style={styles.offlineText}>
                                            Sin conexión • Mostrando datos guardados
                                        </Text>
                                    </View>
                                )}

                                {!searchMode && <StatsCard total={totalProfessors} />}

                                <SearchBar
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onClear={exitSearchMode}
                                />

                                <ScrollView
                                    style={styles.listContainer}
                                    showsVerticalScrollIndicator={false}
                                    removeClippedSubviews={true}
                                    contentContainerStyle={styles.listContent}
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
                                    {professors.length === 0 ? (
                                        loading ? (
                                            <ProfessorCardSkeleton count={5} />
                                        ) : isOfflineMode ? (
                                            <View style={styles.emptyContainer}>
                                                <View style={styles.emptyIconContainer}>
                                                    <Ionicons name="cloud-offline-outline" size={64} color={Colors.textTertiary} />
                                                </View>
                                                <Text style={styles.emptyTitle}>Sin conexión</Text>
                                                <Text style={styles.emptyText}>
                                                    No hay datos guardados. Conecta a internet para cargar docentes.
                                                </Text>
                                            </View>
                                        ) : (
                                            <EmptyState
                                                hasSearchQuery={searchMode && searchQuery.trim().length >= 3}
                                                entityName="docentes"
                                            />
                                        )
                                    ) : (
                                        professors.map((professor, index) => (
                                            <ProfessorCard
                                                key={professor.id}
                                                professor={professor}
                                                index={index}
                                                onView={() => handleView(professor)}
                                                onEdit={() => handleEdit(professor)}
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
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? 60 : 70,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
        }),
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.3,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f59e0b',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 16,
        marginBottom: 20,
        gap: 10,
    },
    offlineText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        letterSpacing: 0.2,
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 20,
    },
    // Stats Card
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statsLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    statsValue: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.primary,
        marginTop: 4,
    },
    statsSubtitle: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 4,
    },
    statsCardSkeleton: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    // Search Bar
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    searchBarSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardSkeleton: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    cardName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    cardYear: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledEditButton: {
        backgroundColor: '#f1f5f9',
    },
    cardStats: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.backgroundTertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
});

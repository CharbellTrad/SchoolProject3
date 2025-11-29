import { EditSectionModal } from '@/components/section/EditSectionModal';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, SearchBar, SearchBarSkeleton, StatsCards, StatsCardsSkeleton } from '../../../../components/list';
import { SectionCard } from '../../../../components/section/SectionCard';
import { showAlert } from '../../../../components/showAlert';
import Colors from '../../../../constants/Colors';
import { useSections } from '../../../../hooks';
import type { Section } from '../../../../services-odoo/sectionService';

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
  } = useSections();

const [selectedSection, setSelectedSection] = useState<Section | null>(null);
const [showEditModal, setShowEditModal] = useState(false);

  // Estados para crossfade
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Crossfade suave cuando hay datos
  useEffect(() => {
    if (!initialLoading && showSkeleton && sections.length > 0) {
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
  }, [initialLoading, showSkeleton, sections.length, fadeAnim]);

    const handleEdit = (section: Section) => {
    if (isOfflineMode) {
        showAlert('Sin conexión', 'No puedes editar secciones sin conexión a internet.');
        return;
    }
    setSelectedSection(section);
    setShowEditModal(true);
    };

  const handleDeleteSection = async (section: Section) => {
    showAlert(
      '¿Eliminar sección?',
      `¿Estás seguro de eliminar "${section.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await handleDelete(section.id);
              showAlert('✅ Éxito', 'Sección eliminada correctamente');
            } catch (error: any) {
              showAlert('❌ Error', error.message || 'No se pudo eliminar la sección');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Head>
        <title>Lista de Secciones</title>
      </Head>
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Secciones</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.addButton,
              (isOfflineMode || showSkeleton) && styles.disabledButton,
            ]}
            onPress={() => {
              if (isOfflineMode) {
                showAlert('Sin conexión', 'No puedes crear secciones sin conexión a internet.');
                return;
              }
              if (!showSkeleton) {
                router.push('/admin/academic-management/register-section-subject/register-section' as any);
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
              <StatsCardsSkeleton />
              <SearchBarSkeleton />
              <ScrollView
                style={styles.listContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              >
                <SectionCardSkeleton count={5} />
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

              {!searchMode && (
                <>
                  <StatsCards total={totalSections} />
                  
                  {/* Estadísticas por tipo */}
                  <View style={styles.typeStatsContainer}>
                    <TypeStatCard
                      icon="color-palette"
                      label="Preescolar"
                      count={countByType.pre}
                      color="#ec4899"
                    />
                    <TypeStatCard
                      icon="book"
                      label="Primaria"
                      count={countByType.primary}
                      color="#3b82f6"
                    />
                    <TypeStatCard
                      icon="school"
                      label="Media"
                      count={countByType.secundary}
                      color="#10b981"
                    />
                  </View>
                </>
              )}

              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar sección..."
                onClear={exitSearchMode}
              />

              <EditSectionModal
                visible={showEditModal}
                section={selectedSection}
                onClose={() => setShowEditModal(false)}
                onSave={onRefresh}
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
                {sections.length === 0 ? (
                  loading ? (
                    <SectionCardSkeleton count={5} />
                  ) : isOfflineMode ? (
                    <View style={styles.emptyContainer}>
                      <View style={styles.emptyIconContainer}>
                        <Ionicons name="cloud-offline-outline" size={64} color={Colors.textTertiary} />
                      </View>
                      <Text style={styles.emptyTitle}>Sin conexión</Text>
                      <Text style={styles.emptyText}>
                        No hay datos guardados. Conecta a internet para cargar secciones.
                      </Text>
                    </View>
                  ) : searchMode && searchQuery.trim().length < 3 ? (
                    <View style={styles.emptyContainer}>
                      <View style={styles.emptyIconContainer}>
                        <Ionicons name="search-outline" size={64} color={Colors.textTertiary} />
                      </View>
                      <Text style={styles.emptyTitle}>Escribe para buscar</Text>
                      <Text style={styles.emptyText}>
                        Ingresa al menos 3 caracteres para comenzar
                      </Text>
                    </View>
                  ) : (
                    <EmptyState
                      hasSearchQuery={searchMode && searchQuery.trim().length >= 3}
                      entityName="secciones"
                    />
                  )
                ) : (
                  sections.map((section, index) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      index={index}
                      onEdit={() => handleEdit(section)}
                      isOfflineMode={isOfflineMode}
                    />
                  ))
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </View>
    </>
  );
}

// ============ COMPONENTES AUXILIARES ============

interface TypeStatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  color: string;
}

const TypeStatCard: React.FC<TypeStatCardProps> = ({ icon, label, count, color }) => {
  return (
    <View style={[styles.typeStatCard, { borderLeftColor: color }]}>
      <View style={[styles.typeStatIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.typeStatContent}>
        <Text style={styles.typeStatCount}>{count}</Text>
        <Text style={styles.typeStatLabel}>{label}</Text>
      </View>
    </View>
  );
};

const SectionCardSkeleton: React.FC<{ count: number }> = ({ count }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[styles.skeletonCard, { opacity }]}
        />
      ))}
    </>
  );
};

// ============ ESTILOS ============

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
      android: {
        elevation: 8,
      },
    }),
  },
  backButton: {
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
    ...Platform.select({
      android: {
        elevation: 4,
      },
    }),
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },
  typeStatsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  typeStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typeStatContent: {
    flex: 1,
  },
  typeStatCount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  typeStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
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
  skeletonCard: {
    height: 96,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    marginBottom: 12,
  },
});
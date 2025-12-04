import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EmptyState } from '../../../../components/list';
import { EditSubjectModal, SubjectCard, SubjectCardSkeleton, SubjectSearchBar, SubjectSearchBarSkeleton, SubjectStatsCard, SubjectStatsCardSkeleton, ViewSubjectModal } from '../../../../components/subject';
import Colors from '../../../../constants/Colors';
import { useSubjects } from '../../../../hooks';
import { Subject } from '../../../../services-odoo/subjectService';

export default function SubjectsListScreen() {
  const {
    subjects,
    loading,
    initialLoading,
    refreshing,
    searchQuery,
    searchMode,
    totalSubjects,
    isOfflineMode,
    secundarySections,
    activeProfessors,
    setSearchQuery,
    exitSearchMode,
    onRefresh,
    handleDelete,
    loadRelatedData,
  } = useSubjects();

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Cargar datos relacionados al montar
  useEffect(() => {
    loadRelatedData();
  }, []);

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

  const handleView = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowViewModal(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowEditModal(true);
  };

  return (
    <>
      <Head>
        <title>Lista de Materias</title>
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
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Materias</Text>
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
                    'No puedes crear materias sin conexión a internet.'
                  );
                  return;
                }
                if (!showSkeleton) {
                  router.push('/admin/academic-management/section-subject/register-subject' as any);
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
              // SKELETON INICIAL - Espera hasta que haya datos
              <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <SubjectStatsCardSkeleton />
                <SubjectSearchBarSkeleton />
                <ScrollView
                  style={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                >
                  <SubjectCardSkeleton count={5} />
                </ScrollView>
              </Animated.View>
            ) : (
              // CONTENIDO REAL con fade in
              <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {isOfflineMode && (
                  <View style={styles.offlineBanner}>
                    <Ionicons name="cloud-offline" size={20} color="#fff" />
                    <Text style={styles.offlineText}>
                      Sin conexión • Mostrando datos guardados
                    </Text>
                  </View>
                )}

                {!searchMode && <SubjectStatsCard total={totalSubjects} />}

                <SubjectSearchBar
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
                  {subjects.length === 0 ? (
                    loading ? (
                      <SubjectCardSkeleton count={5} />
                    ) : isOfflineMode ? (
                      <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                          <Ionicons name="cloud-offline-outline" size={64} color={Colors.textTertiary} />
                        </View>
                        <Text style={styles.emptyTitle}>Sin conexión</Text>
                        <Text style={styles.emptyText}>
                          No hay datos guardados. Conecta a internet para cargar materias.
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
                        entityName="materias"
                      />
                    )
                  ) : (
                    subjects.map((subject, index) => (
                      <SubjectCard
                        key={subject.id}
                        subject={subject}
                        index={index}
                        onView={() => handleView(subject)}
                        onEdit={() => handleEdit(subject)}
                        isOfflineMode={isOfflineMode}
                      />
                    ))
                  )}
                  <View style={{ height: 120 }} />
                </ScrollView>
              </Animated.View>
            )}
          </View>

          <ViewSubjectModal
            visible={showViewModal}
            subject={selectedSubject}
            sections={secundarySections}
            professors={activeProfessors}
            onClose={() => setShowViewModal(false)}
            onEdit={() => {
              setShowViewModal(false);
              setShowEditModal(true);
            }}
          />

          <EditSubjectModal
            visible={showEditModal}
            subject={selectedSubject}
            sections={secundarySections}
            professors={activeProfessors}
            onClose={() => setShowEditModal(false)}
            onSave={() => {
              setShowEditModal(false);
              onRefresh();
            }}
          />
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
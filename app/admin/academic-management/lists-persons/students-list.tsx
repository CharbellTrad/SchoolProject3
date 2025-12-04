import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EmptyState, Pagination, PaginationSkeleton, SearchBar, SearchBarSkeleton, StatsCards, StatsCardsSkeleton } from '../../../../components/list';
import { EditStudentModal, StudentCard, StudentCardSkeletonList, ViewStudentModal } from '../../../../components/student';
import Colors from '../../../../constants/Colors';
import { useStudentsPagination } from '../../../../hooks/useStudentsPagination';
import { Student } from '../../../../services-odoo/personService';

export default function StudentsListScreen() {
  const {
    students,
    loading,
    initialLoading,
    refreshing,
    searchQuery,
    searchMode,
    totalStudents,
    currentPage,
    totalPages,
    isOfflineMode,
    setSearchQuery,
    exitSearchMode,
    goToPage,
    onRefresh,
    handleDelete,
  } = useStudentsPagination();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent />
      <>
        <Head>
          <title>Lista de Estudiantes</title>
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
              <Text style={styles.headerTitle}>Estudiantes</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.addButton,
                (isOfflineMode || showSkeleton) && styles.disabledButton
              ]}
              onPress={() => {
                if (isOfflineMode) {
                  showAlert(
                    'Sin conexión',
                    'No puedes crear estudiantes sin conexión a internet.'
                  );
                  return;
                }
                if (!showSkeleton) {
                  router.push('/admin/academic-management/register-person/register-student');
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
                <StatsCardsSkeleton />
                <SearchBarSkeleton />
                <PaginationSkeleton />
                <ScrollView
                  style={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                >
                  <StudentCardSkeletonList count={5} />
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

                {!searchMode && (
                  <StatsCards total={totalStudents} />
                )}

                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar por nombre o cédula..."
                  onClear={exitSearchMode}
                />

                {!searchMode && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                )}

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
                  {students.length === 0 ? (
                    loading ? (
                      <StudentCardSkeletonList count={5} />
                    ) : isOfflineMode ? (
                      <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                          <Ionicons name="cloud-offline-outline" size={64} color={Colors.textTertiary} />
                        </View>
                        <Text style={styles.emptyTitle}>Sin conexión</Text>
                        <Text style={styles.emptyText}>
                          No hay datos guardados. Conecta a internet para cargar estudiantes.
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
                        entityName="estudiantes"
                      />
                    )
                  ) : (
                    students.map((student, index) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        index={index}
                        onView={() => handleView(student)}
                        onEdit={() => handleEdit(student)}
                        isOfflineMode={isOfflineMode}
                      />
                    ))
                  )}
                  <View style={{ height: 40 }} />
                </ScrollView>
              </Animated.View>
            )}
          </View>

          <ViewStudentModal
            visible={showViewModal}
            student={selectedStudent}
            onClose={() => setShowViewModal(false)}
            onEdit={() => {
              setShowViewModal(false);
              setShowEditModal(true);
            }}
          />

          <EditStudentModal
            visible={showEditModal}
            student={selectedStudent}
            onClose={() => setShowEditModal(false)}
            onSave={() => {
              setShowEditModal(false);
              onRefresh();
            }}
            onDelete={handleDelete}
          />
        </View>
      </>
    </SafeAreaProvider>
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
      }
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

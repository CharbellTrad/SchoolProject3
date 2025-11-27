import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, Pagination, SearchBar, StatsCards } from '../../../../components/list';
import { EditStudentModal, StudentCard, ViewStudentModal } from '../../../../components/student';
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

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando estudiantes...</Text>
      </View>
    );
  }

  return (
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
            <Text style={styles.headerSubtitle}>{totalStudents} registrados</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.addButton,
              isOfflineMode && styles.disabledButton
            ]}
            onPress={() => {
              if (isOfflineMode) {
                showAlert(
                  'Sin conexión',
                  'No puedes crear estudiantes sin conexión a internet.'
                );
                return;
              }
              router.push('/admin/academic-management/register-person/register-student');
            }}
            disabled={isOfflineMode}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={isOfflineMode ? '#9ca3af' : '#fff'} />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>
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

          {loading && !initialLoading && students.length === 0 && (
            <View style={styles.pageLoadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.pageLoadingText}>
                {searchMode ? `Buscando "${searchQuery}"...` : `Cargando página ${currentPage}...`}
              </Text>
            </View>
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
              isOfflineMode ? (
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
              students.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onView={() => handleView(student)}
                  onEdit={() => handleEdit(student)}
                  isOfflineMode={isOfflineMode}
                />
              ))
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
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
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
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
  pageLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  pageLoadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
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

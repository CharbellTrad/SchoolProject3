import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, Pagination, SearchBar, StatsCards } from '../../../../components/list';
import { EditStudentModal, StudentCard, ViewStudentModal } from '../../../../components/student';
import Colors from '../../../../constants/Colors';
import { listStyles } from '../../../../constants/Styles';
import { useStudentsPagination } from '../../../../hooks/useStudentsPagination';
import { Student } from '../../../../services-odoo/personService';

export default function StudentsListScreen() {
  const {
    students,
    loading,
    refreshing,
    searchQuery,
    totalStudents,
    activeStudents,
    currentPage,
    totalPages,
    isOfflineMode,
    setSearchQuery,
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

  if (loading) {
    return (
      <View style={listStyles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Head>
        <title>Lista de Matrículas</title>
      </Head>
      <View style={listStyles.container}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={listStyles.header}>
          <TouchableOpacity style={listStyles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={listStyles.headerTitle}>Matrículas</Text>
          <TouchableOpacity
            style={[
              listStyles.addButton,
              isOfflineMode && styles.disabledButton  // 👈 Agregar estilo cuando está offline
            ]}
            onPress={() => {
              if (isOfflineMode) {
                showAlert(
                  'Sin conexión',
                  'No puedes crear estudiantes sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.'
                );
                return;
              }
              router.push('/admin/academic-management/register-person/register-student');
            }}
            disabled={isOfflineMode}  // 👈 Deshabilitar el botón
          >
            <Ionicons name="add" size={24} color={isOfflineMode ? '#9ca3af' : '#fff'} />
          </TouchableOpacity>
        </LinearGradient>

        <View style={listStyles.content}>
          {/* Banner de Modo Offline */}
          {isOfflineMode && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline" size={20} color="#fff" />
              <Text style={styles.offlineText}>
                Modo sin conexión - Mostrando datos guardados
              </Text>
            </View>
          )}

          <StatsCards
            total={totalStudents}
            active={activeStudents}
          />

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o cédula..."
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />

          <ScrollView
            style={listStyles.listContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
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
                <View style={styles.emptyOfflineContainer}>
                  <Ionicons name="cloud-offline-outline" size={80} color={Colors.textSecondary} />
                  <Text style={styles.emptyOfflineTitle}>Sin conexión</Text>
                  <Text style={styles.emptyOfflineText}>
                    No hay datos guardados. Conecta a internet para cargar estudiantes.
                  </Text>
                </View>
              ) : (
                <EmptyState
                  hasSearchQuery={!!searchQuery}
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  emptyOfflineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyOfflineTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyOfflineText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // 👇 NUEVO: Estilo para botón deshabilitado
  disabledButton: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, SearchBar, StatsCards } from '../../../../components/list';
import { EditStudentModal, StudentCard, ViewStudentModal } from '../../../../components/student';
import Colors from '../../../../constants/Colors';
import { listStyles } from '../../../../constants/Styles';
import { useStudentsList } from '../../../../hooks';
import { Student } from '../../../../services-odoo/personService';

export default function StudentsListScreen() {
  const {
    loading,
    refreshing,
    searchQuery,
    filteredStudents,
    activeStudentsCount,
    students,
    isOfflineMode,
    setSearchQuery,
    loadData,
    handleDelete,
    onRefresh,
  } = useStudentsList();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

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
            style={listStyles.addButton}
            onPress={() => router.push('/admin/academic-management/register-person/register-student')}
          >
            <Ionicons name="add" size={24} color="#fff" />
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
            total={students.length}
            active={activeStudentsCount}
          />

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o cédula..."
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
            {filteredStudents.length === 0 ? (
              isOfflineMode && students.length === 0 ? (
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
              filteredStudents.map((student) => (
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
            loadData();
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
});
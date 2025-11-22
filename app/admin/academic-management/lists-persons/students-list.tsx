import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
              <EmptyState 
                hasSearchQuery={!!searchQuery}
                entityName="estudiantes"
              />
            ) : (
              filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onView={() => handleView(student)}
                  onEdit={() => handleEdit(student)}
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

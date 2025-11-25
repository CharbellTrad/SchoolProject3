import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState, SearchBar, StatsCards } from '../../../../components/list';
import { EditStudentModal, StudentCard, ViewStudentModal } from '../../../../components/student';
import Colors from '../../../../constants/Colors';
import { listStyles } from '../../../../constants/Styles';
import { useStudentsList } from '../../../../hooks';
import { Student } from '../../../../services-odoo/personService';

export default function StudentsListScreen() {
  const {
    students,
    loading,
    refreshing,
    searchQuery,
    filteredStudents,
    totalStudents,
    hasMore,
    loadingMore,
    isSearching,
    isOfflineMode,
    setSearchQuery,
    loadData,
    handleDelete,
    onRefresh,
    loadMore,
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

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingMoreText}>Cargando más estudiantes...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading || isSearching) {
      return null;
    }

    if (isOfflineMode && students.length === 0) {
      return (
        <View style={styles.emptyOfflineContainer}>
          <Ionicons name="cloud-offline-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyOfflineTitle}>Sin conexión</Text>
          <Text style={styles.emptyOfflineText}>
            No hay datos guardados. Conecta a internet para cargar estudiantes.
          </Text>
        </View>
      );
    }

    return (
      <EmptyState 
        hasSearchQuery={!!searchQuery}
        entityName="estudiantes"
      />
    );
  };

  if (loading) {
    return (
      <View style={listStyles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando estudiantes...</Text>
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
          {/* 🔴 Banner de Modo Offline */}
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
            active={students.filter(s => s.is_active).length}
          />

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o cédula..."
          />

          {/* 🔍 Indicador de búsqueda */}
          {isSearching && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.searchingText}>Buscando...</Text>
            </View>
          )}

          {/* 📊 Indicador de total */}
          {!isSearching && totalStudents > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>
                {searchQuery 
                  ? `${filteredStudents.length} resultado${filteredStudents.length !== 1 ? 's' : ''}`
                  : `Mostrando ${filteredStudents.length} de ${totalStudents}`}
              </Text>
            </View>
          )}

          {/* 📜 LISTA CON SCROLL INFINITO */}
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <StudentCard
                student={item}
                onView={() => handleView(item)}
                onEdit={() => handleEdit(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={() => {
              if (!searchQuery && hasMore && !loadingMore) {
                loadMore();
              }
            }}
            onEndReachedThreshold={0.5}
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
          />
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
            // ⚡ ACTUALIZACIÓN AUTOMÁTICA después de editar
            loadData(true);
          }}
          onDelete={handleDelete}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
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
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  searchingText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  totalContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  totalText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
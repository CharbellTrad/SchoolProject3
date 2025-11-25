import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { listStyles } from '../../constants/Styles';
import { useStudentDetails } from '../../hooks';
import { Student } from '../../services-odoo/personService';
import { BirthTab, DocumentsTab, GeneralTab, InscriptionsTab, ParentsTab, SizesTab } from './view';

type ViewTab = 'general' | 'sizes' | 'birth' | 'parents' | 'inscriptions' | 'documents';

interface ViewStudentModalProps {
  visible: boolean;
  student: Student | null;
  onClose: () => void;
  onEdit: () => void;
}

const TABS = [
  { id: 'general' as ViewTab, label: 'General', icon: 'person' },
  { id: 'sizes' as ViewTab, label: 'Tallas', icon: 'resize' },
  { id: 'birth' as ViewTab, label: 'Nacimiento', icon: 'heart' },
  { id: 'parents' as ViewTab, label: 'Padres', icon: 'people' },
  { id: 'inscriptions' as ViewTab, label: 'Inscripciones', icon: 'school' },
  { id: 'documents' as ViewTab, label: 'Documentos', icon: 'document' },
];

export const ViewStudentModal: React.FC<ViewStudentModalProps> = ({
  visible,
  student,
  onClose,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('general');

  // Cargar detalles cuando el modal es visible y hay un estudiante
  const { parents, inscriptions, loading } = useStudentDetails({
    studentId: student?.id || 0,
    parentIds: student?.parents_ids || [],
    inscriptionIds: student?.inscription_ids || [],
    shouldLoad: visible && !!student
  });

  // Combinar datos cargados con el estudiante
  const studentWithDetails = student ? {
    ...student,
    parents: parents.length > 0 ? parents : student.parents,
    inscriptions: inscriptions.length > 0 ? inscriptions : student.inscriptions
  } : null;

  useEffect(() => {
    if (!visible) {
      setActiveTab('general');
    }
  }, [visible]);

  if (!studentWithDetails) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab student={studentWithDetails} />;
      case 'sizes':
        return <SizesTab student={studentWithDetails} />;
      case 'birth':
        return <BirthTab student={studentWithDetails} />;
      case 'parents':
        return <ParentsTab student={studentWithDetails} loading={loading} />;
      case 'inscriptions':
        return <InscriptionsTab student={studentWithDetails} loading={loading} />;
      case 'documents':
        return <DocumentsTab student={studentWithDetails} />;
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={listStyles.modalOverlay}>
        <View style={listStyles.modalContentView}>
          <View style={listStyles.modalHeader}>
            <Text style={listStyles.modalTitle}>Información del Estudiante</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={18}
                    color={activeTab === tab.id ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={listStyles.modalBodyView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={listStyles.scrollContent}
          >
            {renderTabContent()}
            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={listStyles.modalFooter}>
            <TouchableOpacity style={listStyles.modalButton} onPress={onEdit}>
              <Ionicons name="create" size={20} color="#fff" />
              <Text style={listStyles.modalButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

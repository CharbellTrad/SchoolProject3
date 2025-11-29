import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { useStudentDetails } from '../../hooks';
import { Student, loadStudentFullDetails } from '../../services-odoo/personService';
import { BirthTab, DocumentsTab, GeneralTab, InscriptionsTab, ParentsTab, SizesTab } from './view';
import { GeneralTabSkeleton, InscriptionsTabSkeleton, ParentsTabSkeleton } from './view/skeletons';

type ViewTab = 'general' | 'sizes' | 'birth' | 'parents' | 'inscriptions' | 'documents';

interface ViewStudentModalProps {
  visible: boolean;
  student: Student | null;
  onClose: () => void;
  onEdit: () => void;
}

const TABS: Array<{ id: ViewTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'general', label: 'General', icon: 'person-outline' },
  { id: 'sizes', label: 'Tallas', icon: 'resize-outline' },
  { id: 'birth', label: 'Nacimiento', icon: 'heart-outline' },
  { id: 'parents', label: 'Padres', icon: 'people-outline' },
  { id: 'inscriptions', label: 'Inscripciones', icon: 'school-outline' },
  { id: 'documents', label: 'Documentos', icon: 'document-text-outline' },
];

export const ViewStudentModal: React.FC<ViewStudentModalProps> = ({
  visible,
  student,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('general');
  const [fullStudent, setFullStudent] = useState<Student | null>(null);
  const [loadingFullDetails, setLoadingFullDetails] = useState(false);

  // Estados para el crossfade
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Cargar detalles completos cuando modal se abre
  useEffect(() => {
    if (!visible) {
      setActiveTab('general');
      setFullStudent(null);
      setShowSkeleton(true);
      fadeAnim.setValue(1);
      return;
    }

    if (!student) return;

    const fetchFullDetails = async () => {
      setLoadingFullDetails(true);
      setShowSkeleton(true);
      fadeAnim.setValue(1);

      try {
        const details = await loadStudentFullDetails(student.id);
        setFullStudent(details || student);
      } catch (error) {
        if (__DEV__) {
          console.error('Error loading student details:', error);
        }
        setFullStudent(student);
      } finally {
        setLoadingFullDetails(false);
      }
    };

    fetchFullDetails();
  }, [visible, student?.id]);

  // Efecto para hacer crossfade cuando los datos están listos
  useEffect(() => {
    if (!loadingFullDetails && fullStudent && showSkeleton) {
      // Fade out del skeleton
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Ocultar skeleton y hacer fade in del contenido
        setShowSkeleton(false);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [loadingFullDetails, fullStudent, showSkeleton, fadeAnim]);

  // Cargar datos relacionados (padres, inscripciones)
  const { parents, inscriptions, loading: loadingRelated } = useStudentDetails({
    studentId: fullStudent?.id || 0,
    parentIds: fullStudent?.parents_ids || [],
    inscriptionIds: fullStudent?.inscription_ids || [],
    shouldLoad: visible && !!fullStudent,
  });

  // Combinar datos
  const displayStudent = fullStudent
    ? {
        ...fullStudent,
        parents: parents.length > 0 ? parents : fullStudent.parents,
        inscriptions: inscriptions.length > 0 ? inscriptions : fullStudent.inscriptions,
      }
    : null;

  // Renderizar contenido de pestaña
  const renderContent = () => {
    if (!displayStudent) return null;

    switch (activeTab) {
      case 'general':
        return <GeneralTab student={displayStudent} />;
      case 'sizes':
        return <SizesTab student={displayStudent} />;
      case 'birth':
        return <BirthTab student={displayStudent} />;
      case 'parents':
        return loadingRelated ? <ParentsTabSkeleton /> : <ParentsTab student={displayStudent}/>;
      case 'inscriptions':
        return loadingRelated ? <InscriptionsTabSkeleton /> : <InscriptionsTab student={displayStudent} />;
      case 'documents':
        return <DocumentsTab student={displayStudent} />;
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header - SIEMPRE VISIBLE */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.studentIconBox}>
                <Ionicons name="person" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Información del Estudiante</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color={Colors.error} />
            </TouchableOpacity>
          </View>

          {/* Tabs - SIEMPRE VISIBLE (deshabilitados durante carga) */}
          <View style={styles.tabsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsList}
            >
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.tabButton, 
                    activeTab === tab.id && styles.tabButtonActive,
                    showSkeleton && styles.tabButtonDisabled
                  ]}
                  disabled={showSkeleton}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={activeTab === tab.id ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tab.id && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Body - CROSSFADE */}
          <View style={styles.bodyContainer}>
            {/* SKELETON del contenido */}
            {showSkeleton && (
              <Animated.View style={[styles.absoluteFill, { opacity: fadeAnim }]}>
                <ScrollView
                  style={styles.body}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.bodyContent}
                >
                  <GeneralTabSkeleton />
                </ScrollView>
              </Animated.View>
            )}

            {/* CONTENIDO REAL */}
            <Animated.View style={[styles.absoluteFill, { opacity: showSkeleton ? 0 : fadeAnim }]}>
              <ScrollView
                style={styles.body}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.bodyContent}
              >
                {renderContent()}
              </ScrollView>
            </Animated.View>
          </View>

          {/* Footer - SIEMPRE VISIBLE */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.editBtn, showSkeleton && styles.editBtnDisabled]}
              onPress={onEdit}
              activeOpacity={0.75}
              disabled={showSkeleton}
            >
              <Ionicons name="pencil-outline" size={18} color="#fff" />
              <Text style={styles.editBtnLabel}>Editar Información</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  studentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#f8fafc',
  },
  tabsList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  tabButtonDisabled: {
    opacity: 0.5,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  bodyContainer: {
    flex: 1,
    position: 'relative',
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#f8fafc',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 8,
  },
  editBtnDisabled: {
    opacity: 0.5,
  },
  editBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
  },
});

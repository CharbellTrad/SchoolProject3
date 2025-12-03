import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';
import type { Professor, Section, Subject } from '../../services-odoo/subjectService';
import { InfoRow, InfoSection } from '../list';

interface ViewSubjectModalProps {
  visible: boolean;
  subject: Subject | null;
  sections: Section[];
  professors: Professor[];
  onClose: () => void;
  onEdit: () => void;
}

export const ViewSubjectModal: React.FC<ViewSubjectModalProps> = ({
  visible,
  subject,
  sections,
  professors,
  onClose,
  onEdit,
}) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['90%'], []);
  
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const [professorsExpanded, setProfessorsExpanded] = useState(false);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      // Reset al abrir
      setSectionsExpanded(false);
      setProfessorsExpanded(false);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  if (!subject) return null;

  // Obtener nombres de secciones y profesores
  const assignedSections = sections.filter((s) => subject.section_ids.includes(s.id));
  const assignedProfessors = professors.filter((p) => subject.professor_ids.includes(p.id));

  // Mostrar solo los primeros 6 items cuando está colapsado
  const displayedSections = sectionsExpanded ? assignedSections : assignedSections.slice(0, 6);
  const displayedProfessors = professorsExpanded ? assignedProfessors : assignedProfessors.slice(0, 6);
  
  const hasMoreSections = assignedSections.length > 6;
  const hasMoreProfessors = assignedProfessors.length > 6;

  return (
    <>
      {visible && <StatusBar style="light" />}

      <BottomSheetModal
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.bottomSheetBackground}
        topInset={insets.top}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={true}
        enableOverDrag={false}
      >
        <View style={{ ...styles.container, paddingBottom: insets.bottom }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="book-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Detalles de Materia</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color={Colors.error} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.bodyContent}
          >
            {/* Información General */}
            <InfoSection title="Información General">
              <InfoRow label="Nombre de la Materia" value={subject.name} icon="book" />
            </InfoSection>

            {/* Secciones Asignadas */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Secciones Asignadas</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{subject.section_ids.length}</Text>
                </View>
              </View>

              {assignedSections.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="folder-open-outline" size={32} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>No hay secciones asignadas</Text>
                </View>
              ) : (
                <>
                  <View style={styles.chipsGrid}>
                    {displayedSections.map((section) => (
                      <View key={section.id} style={styles.chip}>
                        <Ionicons name="folder" size={16} color="#3b82f6" />
                        <Text style={styles.chipText} numberOfLines={1}>
                          {section.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  {hasMoreSections && (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => setSectionsExpanded(!sectionsExpanded)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.expandButtonText}>
                        {sectionsExpanded 
                          ? 'Ver menos' 
                          : `Ver ${assignedSections.length - 6} más`
                        }
                      </Text>
                      <Ionicons 
                        name={sectionsExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={Colors.primary} 
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Profesores Asignados */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Profesores Asignados</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{subject.professor_ids.length}</Text>
                </View>
              </View>

              {assignedProfessors.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>No hay profesores asignados</Text>
                </View>
              ) : (
                <>
                  <View style={styles.chipsGrid}>
                    {displayedProfessors.map((professor) => (
                      <View key={professor.id} style={styles.chip}>
                        <Ionicons name="person" size={16} color="#10b981" />
                        <Text style={styles.chipText} numberOfLines={1}>
                          {professor.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  {hasMoreProfessors && (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => setProfessorsExpanded(!professorsExpanded)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.expandButtonText}>
                        {professorsExpanded 
                          ? 'Ver menos' 
                          : `Ver ${assignedProfessors.length - 6} más`
                        }
                      </Text>
                      <Ionicons 
                        name={professorsExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={Colors.primary} 
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </BottomSheetScrollView>

          {/* Footer con botón de editar */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onEdit} style={styles.editBtn} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.editBtnLabel}>Editar Materia</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  handleIndicator: {
    backgroundColor: Colors.border,
    width: 40,
    height: 4,
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBox: {
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
  bodyContent: {
    position: 'absolute',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }
    }),
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    maxWidth: 150,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: Colors.primary + '08',
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
  editBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
  },
});
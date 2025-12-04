import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Importar componentes de Bottom Sheet
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
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
  // ========== REFS ==========
  // Referencia al BottomSheetModal para controlarlo (abrir/cerrar)
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // ========== ESTADOS ==========
  const [activeTab, setActiveTab] = useState<ViewTab>('general');
  const [fullStudent, setFullStudent] = useState<Student | null>(null);
  const [loadingFullDetails, setLoadingFullDetails] = useState(false);

  // Estados para animación de crossfade entre skeleton y contenido real
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Obtener insets para respetar áreas seguras (notch, barras, etc.)
  const insets = useSafeAreaInsets();

  // ========== SNAP POINTS ==========
  // Define los puntos de parada del bottom sheet (alturas donde puede quedarse)
  // useMemo evita recrear el array en cada render
  const snapPoints = useMemo(() => ['90%'], []);

  // ========== EFECTOS ==========
  
  // Efecto que controla la apertura/cierre del BottomSheet según prop "visible"
  useEffect(() => {
    if (visible) {
      // Abrir el bottom sheet cuando visible=true
      bottomSheetRef.current?.present();
    } else {
      // Cerrar el bottom sheet cuando visible=false
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  // Efecto para cargar detalles completos del estudiante cuando se abre el modal
  useEffect(() => {
    // Si el modal no es visible, resetear estados
    if (!visible) {
      setActiveTab('general');
      setFullStudent(null);
      setShowSkeleton(true);
      fadeAnim.setValue(1);
      return;
    }

    // Si no hay estudiante, no hacer nada
    if (!student) return;

    // Función asíncrona para cargar detalles completos del estudiante
    const fetchFullDetails = async () => {
      setLoadingFullDetails(true);
      setShowSkeleton(true);
      fadeAnim.setValue(1); // Resetear animación a visible

      try {
        // Cargar datos completos del estudiante desde el servicio
        const details = await loadStudentFullDetails(student.id);
        setFullStudent(details || student);
      } catch (error) {
        if (__DEV__) {
          console.error('Error loading student details:', error);
        }
        // Si falla, usar los datos básicos del estudiante
        setFullStudent(student);
      } finally {
        setLoadingFullDetails(false);
      }
    };

    fetchFullDetails();
  }, [visible, student?.id]);

  // Efecto para hacer crossfade (transición suave) entre skeleton y contenido real
  useEffect(() => {
    // Solo ejecutar cuando terminó de cargar y hay datos completos
    if (!loadingFullDetails && fullStudent && showSkeleton) {
      // Paso 1: Hacer fade out del skeleton (300ms)
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true, // Usar driver nativo para mejor performance
      }).start(() => {
        // Paso 2: Ocultar skeleton y preparar fade in del contenido
        setShowSkeleton(false);
        fadeAnim.setValue(0);
        
        // Paso 3: Hacer fade in del contenido real (400ms)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [loadingFullDetails, fullStudent, showSkeleton, fadeAnim]);

  // ========== HOOKS PERSONALIZADOS ==========
  
  // Hook que carga datos relacionados (padres e inscripciones) del estudiante
  const { parents, inscriptions, loading: loadingRelated } = useStudentDetails({
    studentId: fullStudent?.id || 0,
    parentIds: fullStudent?.parents_ids || [],
    inscriptionIds: fullStudent?.inscription_ids || [],
    shouldLoad: visible && !!fullStudent, // Solo cargar si modal visible y hay estudiante
  });

  // ========== DATOS COMBINADOS ==========
  
  // Combinar datos básicos con datos relacionados cargados
  const displayStudent = fullStudent
    ? {
        ...fullStudent,
        // Usar datos cargados si existen, sino usar los del fullStudent
        parents: parents.length > 0 ? parents : fullStudent.parents,
        inscriptions: inscriptions.length > 0 ? inscriptions : fullStudent.inscriptions,
      }
    : null;

  // ========== CALLBACKS ==========
  
  // Renderizar backdrop (fondo oscuro detrás del bottom sheet)
  // useCallback evita recrear la función en cada render
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1} // El backdrop desaparece cuando se cierra completamente
        appearsOnIndex={0}      // El backdrop aparece cuando está en el primer snap point
        opacity={0.5}          // Opacidad del fondo oscuro
      />
    ),
    []
  );

  // Callback cuando el bottom sheet cambia de estado (abre/cierra)
  const handleSheetChanges = useCallback((index: number) => {
    // Si index es -1, significa que se cerró completamente
    if (index === -1) {
      onClose(); // Llamar al callback de cierre del padre
    }
  }, [onClose]);

  // ========== RENDERIZADO DE CONTENIDO ==========
  
  // Renderizar el contenido de cada pestaña según la pestaña activa
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
        // Mostrar skeleton mientras carga, después contenido real
        return loadingRelated ? <ParentsTabSkeleton /> : <ParentsTab student={displayStudent} />;
      case 'inscriptions':
        return loadingRelated ? <InscriptionsTabSkeleton /> : <InscriptionsTab student={displayStudent} />;
      case 'documents':
        return <DocumentsTab student={displayStudent} />;
      default:
        return null;
    }
  };

  // ========== RENDER ==========
  return (
    <>
      {/* StatusBar para controlar color de batería/hora mientras modal está abierto */}
      {visible && <StatusBar style="light" />}

      {/* BottomSheetModal: el componente principal del bottom sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={1}                          // Índice inicial (1 = segundo snap point = 92%)
        snapPoints={snapPoints}            // Puntos de parada ['50%', '92%']
        onChange={handleSheetChanges}      // Callback cuando cambia de estado
        backdropComponent={renderBackdrop} // Renderizar el fondo oscuro
        enablePanDownToClose               // Permitir cerrar arrastrando hacia abajo
        handleIndicatorStyle={styles.handleIndicator} // Estilo del indicador (barrita arriba)
        backgroundStyle={styles.bottomSheetBackground} // Estilo del fondo del sheet
        topInset={insets.top + 20}              // Respetar área segura superior
        enableContentPanningGesture={false}  // Deshabilitar gesto de arrastre en el contenido
        enableHandlePanningGesture={true}    // Solo permitir arrastre desde el handle (barrita superior)
        enableOverDrag={false}               // Evitar sobre-arrastre
        animateOnMount={true}    
      >
        {/* Contenedor principal con padding inferior para área segura */}
        {Platform.OS === 'ios' ? (
           <View style={[styles.contentContainer, { paddingBottom: insets.bottom }]}>
            {/* ========== HEADER ========== */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                    {/* Icono decorativo del estudiante */}
                    <View style={styles.studentIconBox}>
                        <Ionicons name="person" size={24} color={Colors.primary} />
                    </View>
                    <Text style={styles.headerTitle}>Información del Estudiante</Text>
                    </View>
                    {/* Botón de cerrar */}
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={28} color={Colors.error} />
                    </TouchableOpacity>
                </View>

                {/* ========== TABS ========== */}
                {/* ScrollView horizontal para pestañas (siempre visible) */}
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
                            activeTab === tab.id && styles.tabButtonActive,  // Estilo de pestaña activa
                            showSkeleton && styles.tabButtonDisabled         // Deshabilitar durante carga
                        ]}
                        disabled={showSkeleton} // Desactivar botones mientras muestra skeleton
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

                {/* ========== BODY CON CROSSFADE ========== */}
                <View style={styles.bodyContainer}>
                    
                    {/* SKELETON: Mostrado mientras carga con animación de fade */}
                    {showSkeleton && (
                    <Animated.View style={[styles.absoluteFill, { opacity: fadeAnim }]}>
                        <BottomSheetScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                        >
                        <GeneralTabSkeleton />
                        </BottomSheetScrollView>
                    </Animated.View>
                    )}

                    {/* CONTENIDO REAL: Mostrado después de cargar con fade in */}
                    <Animated.View style={[styles.absoluteFill, { opacity: showSkeleton ? 0 : fadeAnim }]}>
                    <BottomSheetScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                    >
                        {renderContent()}
                    </BottomSheetScrollView>
                    </Animated.View>
                </View>

                {/* ========== FOOTER ========== */}
                {/* Botón de editar (siempre visible, deshabilitado durante carga) */}
                <View style={styles.footer}>
                    <TouchableOpacity
                    style={[styles.editBtn, showSkeleton && styles.editBtnDisabled]}
                    onPress={onEdit}
                    activeOpacity={0.75}
                    disabled={showSkeleton} // Desactivar mientras muestra skeleton
                    >
                    <Ionicons name="pencil-outline" size={18} color="#fff" />
                    <Text style={styles.editBtnLabel}>Editar Información</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ) : (
            <View style={[styles.contentContainer, { paddingBottom: insets.bottom }]}>
            {/* ========== HEADER ========== */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                    {/* Icono decorativo del estudiante */}
                    <View style={styles.studentIconBox}>
                        <Ionicons name="person" size={24} color={Colors.primary} />
                    </View>
                    <Text style={styles.headerTitle}>Información del Estudiante</Text>
                    </View>
                    {/* Botón de cerrar */}
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={28} color={Colors.error} />
                    </TouchableOpacity>
                </View>

                {/* ========== TABS ========== */}
                {/* ScrollView horizontal para pestañas (siempre visible) */}
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
                            activeTab === tab.id && styles.tabButtonActive,  // Estilo de pestaña activa
                            showSkeleton && styles.tabButtonDisabled         // Deshabilitar durante carga
                        ]}
                        disabled={showSkeleton} // Desactivar botones mientras muestra skeleton
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

                {/* ========== BODY CON CROSSFADE ========== */}
                <View style={styles.bodyContainer}>
                    
                    {/* SKELETON: Mostrado mientras carga con animación de fade */}
                    {showSkeleton && (
                    <Animated.View style={[styles.absoluteFill, { opacity: fadeAnim }]}>
                        <BottomSheetScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                        >
                        <GeneralTabSkeleton />
                        </BottomSheetScrollView>
                    </Animated.View>
                    )}

                    {/* CONTENIDO REAL: Mostrado después de cargar con fade in */}
                    <Animated.View style={[styles.absoluteFill, { opacity: showSkeleton ? 0 : fadeAnim }]}>
                    <BottomSheetScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                    >
                        {renderContent()}
                    </BottomSheetScrollView>
                    </Animated.View>
                </View>

                {/* ========== FOOTER ========== */}
                {/* Botón de editar (siempre visible, deshabilitado durante carga) */}
                <View style={styles.footer}>
                    <TouchableOpacity
                    style={[styles.editBtn, showSkeleton && styles.editBtnDisabled]}
                    onPress={onEdit}
                    activeOpacity={0.75}
                    disabled={showSkeleton} // Desactivar mientras muestra skeleton
                    >
                    <Ionicons name="pencil-outline" size={18} color="#fff" />
                    <Text style={styles.editBtnLabel}>Editar Información</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}
      </BottomSheetModal>
    </>
  );
};

// ========== ESTILOS ==========
const styles = StyleSheet.create({
  // Estilo del indicador (barrita de arrastre superior)
  handleIndicator: {
    backgroundColor: Colors.border,
    width: 40,
    height: 4,
  },
  // Estilo de fondo del bottom sheet
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      }
    }),
  },
  // Contenedor principal dentro del sheet
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Header con título y botón de cerrar
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
  // Wrapper de las pestañas
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
  // Contenedor del cuerpo con crossfade
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
  // Footer con botón de editar
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

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ParentsManagement, StudentBirthForm, StudentDocumentsForm, StudentGeneralForm, StudentSizesForm } from '../../../../components/forms';
import { useImagePicker } from '../../../../components/ImagePicker';
import { showAlert } from '../../../../components/showAlert';
import { Button } from '../../../../components/ui/Button';
import Colors from '../../../../constants/Colors';
import { GlobalStyles } from '../../../../constants/Styles';
import { TabType, useFormValidation, useParentForm, useStudentForm, useTabs } from '../../../../hooks';
import { saveParent, saveStudent } from '../../../../services-odoo/personService';
import { formatDateToOdoo, normalizeGender, normalizeYesNo } from '../../../../utils/formatHelpers';

const TABS = [
  { id: 'general' as TabType, label: 'Información General', icon: 'person' },
  { id: 'sizes' as TabType, label: 'Tallas', icon: 'resize' },
  { id: 'birth' as TabType, label: 'Info. Nacimiento', icon: 'heart' },
  { id: 'parents' as TabType, label: 'Representantes', icon: 'people' },
  { id: 'documents' as TabType, label: 'Documentos', icon: 'document' },
];

export default function RegisterStudentTabsScreen() {
  const { activeTab, changeTab } = useTabs('general');
  const { images, setImage, getImage, clearImage } = useImagePicker();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    studentData,
    sizesData,
    birthData,
    updateStudentField,
    updateSizesField,
    updateBirthField,
  } = useStudentForm();

  const {
    parents,
    currentParent,
    editingParentIndex,
    showAddParent,
    showSearchParent,
    searchQuery,
    searchResults,
    searching,
    updateParentField,
    handleSearchParents,
    addExistingParent,
    addOrUpdateParent,
    removeParent,
    startEditingParent,
    resetCurrentParent,
    setShowAddParent,
    setShowSearchParent,
    closeSearch,
  } = useParentForm();

  const { errors, validateField, validateFields } = useFormValidation();

  const handleStudentFieldChange = (field: string, value: string | boolean) => {
    updateStudentField(field, value);
    if (typeof value === 'string') {
      validateField(field, value, false);
    }
  };

  const handleBirthFieldChange = (field: string, value: string) => {
    updateBirthField(field, value);
    validateField(field, value, false);
  };

  const handleParentFieldChange = (field: string, value: string) => {
    updateParentField(field, value);
    validateField(field, value, true);
  };

  const handleAddParent = () => {
    const requiredFields = [
      'name', 'vat', 'nationality', 'born_date', 'sex', 
      'email', 'phone', 'emergency_phone_number', 
      'live_with_student', 'active_job'
    ];

    const isValid = validateFields(requiredFields, currentParent, true);

    if (!isValid) {
      showAlert('Error', 'Complete todos los campos requeridos del representante');
      return;
    }

    const parentWithImages = {
      ...currentParent,
      image_1920: getImage('parent_photo')?.base64,
      ci_document: getImage('parent_ci_document')?.base64,
      ci_document_filename: getImage('parent_ci_document')?.filename,
      parent_singnature: getImage('parent_signature')?.base64,
    };

    addOrUpdateParent(parentWithImages);
    
    clearImage('parent_photo');
    clearImage('parent_ci_document');
    clearImage('parent_signature');
  };

  const handleEditParent = (index: number, parent: any) => {
    startEditingParent(index, parent);
    
    if (parent.image_1920) {
      setImage('parent_photo', parent.image_1920, 'parent_photo.jpg');
    }
    if (parent.ci_document) {
      setImage('parent_ci_document', parent.ci_document, parent.ci_document_filename || 'ci.jpg');
    }
    if (parent.parent_singnature) {
      setImage('parent_signature', parent.parent_singnature, 'signature.jpg');
    }
  };

  const handleCancelParentForm = () => {
    resetCurrentParent();
    clearImage('parent_photo');
    clearImage('parent_ci_document');
    clearImage('parent_signature');
  };

  const validateAndSubmit = async () => {
    if (parents.length === 0) {
      showAlert('Error', 'Debe agregar al menos un representante');
      changeTab('parents');
      return;
    }

    const requiredStudentFields = [
      'name', 'vat', 'nationality', 'born_date', 'sex', 'blood_type',
      'email', 'phone', 'emergency_phone_number', 'street', 'student_lives'
    ];

    const requiredBirthFields = [
      'suffer_illness_treatment', 'authorize_primary_atention', 
      'pregnat_finished', 'gestation_time', 'peso_al_nacer', 'born_complication'
    ];

    const studentValid = validateFields(requiredStudentFields, studentData, false);
    const birthValid = validateFields(requiredBirthFields, birthData, false);

    if (!studentValid || !birthValid) {
      showAlert('Error', 'Complete todos los campos requeridos');
      changeTab('general');
      return;
    }

    setIsLoading(true);

    try {
      const savedParentIds: number[] = [];
      
      for (const parent of parents) {
        if (parent.id) {
          savedParentIds.push(parent.id);
          continue;
        }
        
        const parentResult = await saveParent({
          name: parent.name!,
          vat: parent.vat!,
          nationality: parent.nationality!,
          born_date: formatDateToOdoo(parent.born_date!),
          sex: normalizeGender(parent.sex!),
          email: parent.email!,
          phone: parent.phone!,
          resident_number: parent.resident_number,
          emergency_phone_number: parent.emergency_phone_number!,
          live_with_student: normalizeYesNo(parent.live_with_student!),
          active_job: normalizeYesNo(parent.active_job!),
          job_place: parent.job_place,
          job: parent.job,
          students_ids: [],
          user_id: null,
          active: true,
          image_1920: parent.image_1920,
          ci_document: parent.ci_document,
          ci_document_filename: parent.ci_document_filename,
          parent_singnature: parent.parent_singnature,
          street: parent.street,
        });

        if (parentResult.success && parentResult.parent) {
          savedParentIds.push(parentResult.parent.id);
        } else {
          setIsLoading(false);
          showAlert('❌ Error', `No se pudo guardar el representante: ${parent.name}`);
          return;
        }
      }

      const studentPhoto = getImage('student_photo');
      const ciDocument = getImage('ci_document');
      const bornDocument = getImage('born_document');

      const result = await saveStudent({
        ...studentData,
        ...birthData,
        born_date: formatDateToOdoo(studentData.born_date),
        sex: normalizeGender(studentData.sex),
        suffer_illness_treatment: normalizeYesNo(birthData.suffer_illness_treatment),
        authorize_primary_atention: normalizeYesNo(birthData.authorize_primary_atention),
        pregnat_finished: normalizeYesNo(birthData.pregnat_finished),
        born_complication: normalizeYesNo(birthData.born_complication),
        sizes_json: sizesData,
        parents_ids: savedParentIds,
        image_1920: studentPhoto?.base64,
        ci_document: ciDocument?.base64,
        ci_document_filename: ciDocument?.filename,
        born_document: bornDocument?.base64,
        born_document_filename: bornDocument?.filename,
        brown_folder: studentData.brown_folder,
        boletin_informative: studentData.boletin_informative,
        user_id: null,
        is_active: true,
      });

      setIsLoading(false);

      if (result && result.success) {
        showAlert('✅ Registro Exitoso', 'Estudiante y representantes registrados correctamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        showAlert('❌ Error', result?.message || 'No se pudo registrar');
      }
    } catch (error) {
      setIsLoading(false);
      showAlert('❌ Error', 'Ocurrió un error inesperado');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <StudentGeneralForm
            data={studentData}
            errors={errors}
            onFieldChange={handleStudentFieldChange}
            onImageSelected={(base64, filename) => setImage('student_photo', base64, filename)}
            studentPhoto={getImage('student_photo')?.base64}
          />
        );

      case 'sizes':
        return (
          <StudentSizesForm
            data={sizesData}
            onFieldChange={updateSizesField}
          />
        );

      case 'birth':
        return (
          <StudentBirthForm
            data={birthData}
            errors={errors}
            onFieldChange={handleBirthFieldChange}
          />
        );

      case 'parents':
        return (
          <ParentsManagement
            parents={parents}
            currentParent={currentParent}
            editingParentIndex={editingParentIndex}
            showAddParent={showAddParent}
            showSearchParent={showSearchParent}
            searchQuery={searchQuery}
            searchResults={searchResults}
            searching={searching}
            errors={errors}
            onAddNewParent={() => setShowAddParent(true)}
            onSearchExisting={() => setShowSearchParent(true)}
            onParentFieldChange={handleParentFieldChange}
            onSearchChange={handleSearchParents}
            onSelectExistingParent={addExistingParent}
            onSaveParent={handleAddParent}
            onEditParent={handleEditParent}
            onRemoveParent={removeParent}
            onCancelForm={handleCancelParentForm}
            onCloseSearch={closeSearch}
            onImageSelected={setImage}
            getImage={getImage}
          />
        );

      case 'documents':
        return (
          <StudentDocumentsForm
            brownFolder={studentData.brown_folder}
            boletinInformative={studentData.boletin_informative}
            onToggleBrownFolder={() => handleStudentFieldChange('brown_folder', !studentData.brown_folder)}
            onToggleBoletinInformative={() => handleStudentFieldChange('boletin_informative', !studentData.boletin_informative)}
            ciDocument={getImage('ci_document')?.base64}
            bornDocument={getImage('born_document')?.base64}
            onCiDocumentSelected={(base64, filename) => setImage('ci_document', base64, filename)}
            onBornDocumentSelected={(base64, filename) => setImage('born_document', base64, filename)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Registrar Estudiante</title>
      </Head>
      <View style={GlobalStyles.container}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={GlobalStyles.header}>
          <TouchableOpacity style={GlobalStyles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={GlobalStyles.headerTitle}>Matrícula</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>

        <View style={GlobalStyles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[GlobalStyles.tab, activeTab === tab.id && GlobalStyles.activeTab]}
                onPress={() => changeTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.id ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[
                  GlobalStyles.tabText,
                  activeTab === tab.id && GlobalStyles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {renderTabContent()}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={GlobalStyles.floatingButtonContainer}>
          <Button
            title={isLoading ? "Guardando..." : "Guardar Matrícula"}
            onPress={validateAndSubmit}
            loading={isLoading}
            icon={isLoading ? undefined : "save"}
            iconPosition="left"
            variant="primary"
            size="large"
            disabled={isLoading}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
});

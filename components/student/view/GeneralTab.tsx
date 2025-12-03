import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { Student } from '../../../services-odoo/personService';
import { formatDateToDisplay, formatGender, formatPhone, formatStudentLives } from '../../../utils/formatHelpers';
import { InfoRow, InfoSection } from '../../list';
import { DocumentViewer } from '../../ui/DocumentViewer';

interface GeneralTabProps {
  student: Student;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ student }) => {
  const [viewerVisible, setViewerVisible] = useState(false);

  const openPhoto = () => {
    if (student.image_1920) {
      setViewerVisible(true);
    }
  };

  const closeViewer = () => {
    setViewerVisible(false);
  };

  return (
    <>
      {student.image_1920 && (
        <View style={{ alignItems: 'center', marginBottom: 10, marginTop: 10 }}>
          <TouchableOpacity 
            onPress={openPhoto}
            activeOpacity={0.8}
            style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: `data:image/jpeg;base64,${student.image_1920}` }}
              style={{ width: 120, height: 120, borderRadius: 12 }}
              resizeMode='cover'
            />
            {/* Overlay sutil */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              padding: 6,
            }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name="expand" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <InfoSection title="Información Personal">
        <InfoRow label="Nombre Completo" value={student.name} icon="person" />
        <InfoRow label="Cédula" value={`${student.nationality}-${student.vat}`} icon="card" />
        <InfoRow label="Fecha de Nacimiento" value={formatDateToDisplay(student.born_date)} icon="calendar" />
        <InfoRow label="Edad" value={student.age ? `${student.age} años` : 'No disponible'} icon="time" />
        <InfoRow label="Género" value={formatGender(student.sex)} icon={student.sex === 'M' ? 'male' : 'female'} />
        <InfoRow label="Tipo de Sangre" value={student.blood_type} icon="water" />
      </InfoSection>

      <InfoSection title="Contacto">
        <InfoRow label="Teléfono" value={formatPhone(student.phone)} icon="call" />
        <InfoRow label="Email" value={student.email || "No disponible"} icon="mail" />
        <InfoRow label="Teléfono Residencia" value={formatPhone(student.resident_number)} icon="home" />
        <InfoRow label="Teléfono Emergencia" value={formatPhone(student.emergency_phone_number)} icon="warning" />
      </InfoSection>

      <InfoSection title="Dirección">
        <InfoRow label="Calle/Avenida" value={student.street} icon="location" />
      </InfoSection>

      <InfoSection title="Información Adicional">
        <InfoRow 
          label="Vive con" 
          value={formatStudentLives(student.student_lives)} 
          icon="home" 
        />
      </InfoSection>

      {student.image_1920 && (
        <DocumentViewer
          visible={viewerVisible}
          uri={student.image_1920}
          fileType="image"
          filename={`${student.name}_foto.jpg`}
          onClose={closeViewer}
        />
      )}
    </>
  );
};

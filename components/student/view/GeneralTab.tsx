import React from 'react';
import { Image, View } from 'react-native';
import { Student } from '../../../services-odoo/personService';
import { formatDateToDisplay, formatGender, formatPhone, formatStudentLives } from '../../../utils/formatHelpers';
import { InfoRow, InfoSection } from '../../list';

interface GeneralTabProps {
  student: Student;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ student }) => {
  return (
    <>
      {student.image_1920 && (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${student.image_1920}` }}
            style={{ width: 120, height: 120, borderRadius: 60 }}
          />
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
    </>
  );
};

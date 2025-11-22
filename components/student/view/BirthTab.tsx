import React from 'react';
import { Student } from '../../../services-odoo/personService';
import { formatYesNo } from '../../../utils/formatHelpers';
import { InfoRow, InfoSection } from '../../list';

interface BirthTabProps {
  student: Student;
}

export const BirthTab: React.FC<BirthTabProps> = ({ student }) => {
  const hasSufferIllness = student.suffer_illness_treatment?.toLowerCase() === 'si' || 
                           student.suffer_illness_treatment?.toLowerCase() === 'sí';
  const hasBornComplication = student.born_complication?.toLowerCase() === 'si' || 
                              student.born_complication?.toLowerCase() === 'sí';

  return (
    <>
      <InfoSection title="Salud">
        <InfoRow 
          label="¿Sufre enfermedad/tratamiento?" 
          value={formatYesNo(student.suffer_illness_treatment)} 
          icon="medical" 
        />
        {hasSufferIllness && student.what_illness_treatment && (
          <InfoRow label="¿Cuál?" value={student.what_illness_treatment} icon="list" />
        )}
        <InfoRow 
          label="¿Autoriza atención primaria?" 
          value={formatYesNo(student.authorize_primary_atention)} 
          icon="shield-checkmark" 
        />
      </InfoSection>

      <InfoSection title="Información del Nacimiento">
        <InfoRow 
          label="¿Embarazo a término?" 
          value={formatYesNo(student.pregnat_finished)} 
          icon="heart" 
        />
        <InfoRow 
          label="Tiempo de Gestación" 
          value={student.gestation_time || 'No especificado'} 
          icon="time" 
        />
        <InfoRow 
          label="Peso al Nacer" 
          value={student.peso_al_nacer ? `${student.peso_al_nacer} kg` : 'No especificado'} 
          icon="fitness" 
        />
        <InfoRow 
          label="¿Complicaciones?" 
          value={formatYesNo(student.born_complication)} 
          icon="alert-circle" 
        />
        {hasBornComplication && student.complication && (
          <InfoRow label="¿Cuál complicación?" value={student.complication} icon="list" />
        )}
      </InfoSection>
    </>
  );
};

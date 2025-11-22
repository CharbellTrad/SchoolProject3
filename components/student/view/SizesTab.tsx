import React from 'react';
import { Student } from '../../../services-odoo/personService';
import { formatNumber, formatShirtSize } from '../../../utils/formatHelpers';
import { InfoRow, InfoSection } from '../../list';

interface SizesTabProps {
  student: Student;
}

export const SizesTab: React.FC<SizesTabProps> = ({ student }) => {
  return (
    <InfoSection title="Tallas Actuales">
      <InfoRow 
        label="Altura" 
        value={student.current_height ? `${formatNumber(student.current_height, 2)} m` : 'No especificado'} 
        icon="resize" 
      />
      <InfoRow 
        label="Peso" 
        value={student.current_weight ? `${formatNumber(student.current_weight, 1)} kg` : 'No especificado'} 
        icon="fitness" 
      />
      <InfoRow 
        label="Talla Camisa" 
        value={formatShirtSize(student.current_size_shirt)} 
        icon="shirt" 
      />
      <InfoRow 
        label="Talla Pantalón" 
        value={student.current_size_pants ? formatNumber(student.current_size_pants, 0) : 'No especificado'} 
        icon="body" 
      />
      <InfoRow 
        label="Talla Zapatos" 
        value={student.current_size_shoes ? formatNumber(student.current_size_shoes, 0) : 'No especificado'} 
        icon="footsteps" 
      />
    </InfoSection>
  );
};

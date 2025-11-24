import React from 'react';
import { DropdownSelector } from './BaseSelector';

const BLOOD_TYPES = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
];

interface BloodTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const BloodTypeSelectorDropdown: React.FC<BloodTypeSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <DropdownSelector
      label="Tipo de Sangre"
      value={value}
      options={BLOOD_TYPES}
      onChange={onChange}
      error={error}
      placeholder="Seleccionar..."
      required
      icon="water"
    />
  );
};

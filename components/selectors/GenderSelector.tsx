import React from 'react';
import { DropdownSelector } from './BaseSelector';

const GENDERS = [
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' },
];

interface GenderSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const GenderSelectorDropdown: React.FC<GenderSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <DropdownSelector
      label="Género"
      value={value}
      options={GENDERS}
      onChange={onChange}
      error={error}
      placeholder="Seleccionar..."
      required
      icon={
        value === 'M' ? 'male' :
        value === 'F' ? 'female' :
        'male-female'
      }
    />
  );
};

import React from 'react';
import { DropdownSelector } from './BaseSelector';

const NATIONALITIES = [
  { label: 'Venezolano', value: 'V' },
  { label: 'Extranjero', value: 'E' },
];

interface NationalitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const NationalitySelectorDropdown: React.FC<NationalitySelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <DropdownSelector
      label="Nacionalidad"
      value={value}
      options={NATIONALITIES}
      onChange={onChange}
      error={error}
      placeholder="Seleccionar..."
      required
      icon={
        value === 'V' ? 'home' : 
        value === 'E' ? 'airplane' : 
        'flag'
      }
    />
  );
};

import React from 'react';
import { BaseSelector } from './BaseSelector';

const GENDERS = [
  { label: 'Masculino', value: 'male' },
  { label: 'Femenino', value: 'female' },
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
    <BaseSelector
      label="Género"
      value={value}
      options={GENDERS}
      onChange={onChange}
      error={error}
      placeholder="Seleccionar género"
      required
      leftIcon="male-female"
    />
  );
};

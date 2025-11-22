import React from 'react';
import { BaseSelector } from './BaseSelector';

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
    <BaseSelector
      label="Nacionalidad"
      value={value}
      options={NATIONALITIES}
      onChange={onChange}
      error={error}
      placeholder="V o E"
      required
      leftIcon="flag"
    />
  );
};

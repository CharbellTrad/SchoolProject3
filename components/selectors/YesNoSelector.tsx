import React from 'react';
import { BaseSelector } from './BaseSelector';

const YES_NO_OPTIONS = [
  { label: 'Sí', value: 'Si' },
  { label: 'No', value: 'No' },
];

interface YesNoSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const YesNoSelectorDropdown: React.FC<YesNoSelectorProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
}) => {
  return (
    <BaseSelector
      label={label}
      value={value}
      options={YES_NO_OPTIONS}
      onChange={onChange}
      error={error}
      placeholder="Seleccionar"
      required={required}
      leftIcon="help-circle"
    />
  );
};

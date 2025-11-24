import React from 'react';
import { DropdownSelector } from './BaseSelector';

const YES_NO_OPTIONS = [
  { label: 'Sí', value: 'si' },
  { label: 'No', value: 'no' },
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
    <DropdownSelector
      label={label}
      value={value}
      options={YES_NO_OPTIONS}
      onChange={onChange}
      error={error}
      placeholder="Seleccionar"
      required={required}
      icon={
        value === 'si' ? 'checkmark-circle' :
        value === 'no' ? 'close-circle' :
        'help-circle'
      }
    />
  );
};

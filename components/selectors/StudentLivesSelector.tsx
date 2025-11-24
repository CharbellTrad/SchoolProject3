import React from 'react';
import { DropdownSelector } from './BaseSelector';

const LIVING_OPTIONS = [
  { label: 'PADRE/MADRE', value: 'P/M' },
  { label: 'OTRO', value: 'O' },
];

interface StudentLivesSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const StudentLivesSelector: React.FC<StudentLivesSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <DropdownSelector
      label="El estudiante vive con"
      value={value}
      options={LIVING_OPTIONS}
      onChange={onChange}
      error={error}
      placeholder="Seleccionar..."
      required
      icon="home"
    />
  );
};

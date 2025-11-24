import React from 'react';
import { DropdownSelector } from './BaseSelector';

const SHIRT_SIZES = [
  { label: 'XS', value: 'xs' },
  { label: 'S', value: 's' },
  { label: 'M', value: 'm' },
  { label: 'L', value: 'l' },
  { label: 'XL', value: 'xl' },
  { label: 'XXL', value: 'xxl' },
];

interface ShirtSizeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const ShirtSizeSelector: React.FC<ShirtSizeSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <DropdownSelector
      label="Talla Camisa"
      value={value}
      options={SHIRT_SIZES}
      onChange={onChange}
      error={error}
      placeholder="Seleccionar..."
      icon="shirt"
    />
  );
};

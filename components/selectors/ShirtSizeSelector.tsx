import React from 'react';
import { BaseSelector } from './BaseSelector';

const SHIRT_SIZES = [
  { label: 'XS', value: 'XS' },
  { label: 'S', value: 'S' },
  { label: 'M', value: 'M' },
  { label: 'L', value: 'L' },
  { label: 'XL', value: 'XL' },
  { label: 'XXL', value: 'XXL' },
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
    <BaseSelector
      label="Talla Camisa"
      value={value}
      options={SHIRT_SIZES}
      onChange={onChange}
      error={error}
      placeholder="Seleccionar talla"
      leftIcon="shirt"
    />
  );
};

import React from 'react';
import { SearchBar } from '../list';

interface SectionSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export const SectionSearchBar: React.FC<SectionSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
}) => {
  return (
    <SearchBar
      value={value}
      onChangeText={onChangeText}
      placeholder="Buscar sección..."
      onClear={onClear}
    />
  );
};

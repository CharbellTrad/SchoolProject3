import React from 'react';
import { SearchBar } from '../list';

interface SubjectSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export const SubjectSearchBar: React.FC<SubjectSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
}) => {
  return (
    <SearchBar
      value={value}
      onChangeText={onChangeText}
      placeholder="Buscar materia..."
      onClear={onClear}
    />
  );
};
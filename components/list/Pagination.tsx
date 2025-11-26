import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [windowStart, setWindowStart] = useState(1);
  const WINDOW_SIZE = 6;

  // Sincronizar ventana con página actual al cambiar de página manualmente
  useEffect(() => {
    const windowEnd = windowStart + WINDOW_SIZE - 1;
    
    // Si la página actual está fuera de la ventana visible, ajustar
    if (currentPage < windowStart || currentPage > windowEnd) {
      // Calcular nueva ventana centrada en la página actual
      const newStart = Math.max(1, currentPage - Math.floor(WINDOW_SIZE / 2));
      setWindowStart(newStart);
    }
  }, [currentPage, windowStart]);

  if (totalPages <= 1) return null;

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const end = Math.min(windowStart + WINDOW_SIZE - 1, totalPages);
    
    for (let i = windowStart; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const handlePrevWindow = () => {
    const newStart = Math.max(1, windowStart - WINDOW_SIZE);
    setWindowStart(newStart);
  };

  const handleNextWindow = () => {
    const newStart = Math.min(totalPages - WINDOW_SIZE + 1, windowStart + WINDOW_SIZE);
    setWindowStart(Math.max(1, newStart));
  };

  const canGoPrev = windowStart > 1;
  const canGoNext = windowStart + WINDOW_SIZE - 1 < totalPages;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.arrow, !canGoPrev && styles.arrowDisabled]}
        onPress={handlePrevWindow}
        disabled={!canGoPrev}
      >
        <Ionicons 
          name="chevron-back" 
          size={20} 
          color={canGoPrev ? Colors.primary : Colors.textTertiary} 
        />
      </TouchableOpacity>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pagesContainer}
      >
        {getPageNumbers().map((page) => (
          <TouchableOpacity
            key={page}
            style={[
              styles.pageButton,
              page === currentPage && styles.pageButtonActive,
            ]}
            onPress={() => onPageChange(page)}
          >
            <Text
              style={[
                styles.pageText,
                page === currentPage && styles.pageTextActive,
              ]}
            >
              {page}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.arrow, !canGoNext && styles.arrowDisabled]}
        onPress={handleNextWindow}
        disabled={!canGoNext}
      >
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={canGoNext ? Colors.primary : Colors.textTertiary} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 8,
  },
  pagesContainer: {
    gap: 8,
    paddingHorizontal: 8,
    flexGrow: 1,
    justifyContent: 'center',
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  arrowDisabled: {
    backgroundColor: '#f5f5f5',
  },
  pageButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    elevation: 2,
  },
  pageButtonActive: {
    backgroundColor: Colors.primary,
  },
  pageText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pageTextActive: {
    color: '#fff',
  },
});

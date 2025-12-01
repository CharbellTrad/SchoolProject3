import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const WINDOW_SIZE = 5;

  useEffect(() => {
    const windowEnd = windowStart + WINDOW_SIZE - 1;
    
    if (currentPage < windowStart || currentPage > windowEnd) {
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
        activeOpacity={0.7}
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
            activeOpacity={0.7}
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
        activeOpacity={0.7}
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
    gap: 8,
    marginBottom: 8,
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
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
  },
  arrowDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: Colors.backgroundTertiary,
  },
  pageButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
  },
  pageButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pageText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pageTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
});

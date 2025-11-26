import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (currentPage > 3) pages.push('...');
      
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('...');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.arrow, currentPage === 1 && styles.arrowDisabled]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Ionicons 
          name="chevron-back" 
          size={20} 
          color={currentPage === 1 ? Colors.textTertiary : Colors.primary} 
        />
      </TouchableOpacity>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pagesContainer}
      >
        {getPageNumbers().map((page, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pageButton,
              page === currentPage && styles.pageButtonActive,
              page === '...' && styles.pageButtonDots,
            ]}
            onPress={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
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
        style={[styles.arrow, currentPage === totalPages && styles.arrowDisabled]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={currentPage === totalPages ? Colors.textTertiary : Colors.primary} 
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
    gap: 8,
  },
  pagesContainer: {
    gap: 8,
    paddingHorizontal: 8,
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pageButtonActive: {
    backgroundColor: Colors.primary,
  },
  pageButtonDots: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
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
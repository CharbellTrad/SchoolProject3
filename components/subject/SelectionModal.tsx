import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { Button } from '../ui/Button';

interface SelectionItem {
  id: number;
  name: string;
}

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: SelectionItem[];
  selectedIds: number[];
  onConfirm: (selectedIds: number[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function SelectionModal({
  visible,
  onClose,
  title,
  items,
  selectedIds,
  onConfirm,
  loading = false,
  emptyMessage = 'No hay elementos disponibles',
  icon = 'list',
}: SelectionModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>(selectedIds);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ['90%'], []);


  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Filtrar items según búsqueda
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // Toggle selección
  const toggleItem = useCallback((itemId: number) => {
    setTempSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  // Confirmar selección
  const handleConfirm = useCallback(() => {
    onConfirm(tempSelectedIds);
    bottomSheetRef.current?.close();
  }, [tempSelectedIds, onConfirm]);

  // Cancelar
  const handleCancel = useCallback(() => {
    setTempSelectedIds(selectedIds);
    setSearchQuery('');
    bottomSheetRef.current?.close();
  }, [selectedIds]);

  // Seleccionar todos
  const handleSelectAll = useCallback(() => {
    setTempSelectedIds(filteredItems.map((item) => item.id));
  }, [filteredItems]);

  // Deseleccionar todos
  const handleDeselectAll = useCallback(() => {
    setTempSelectedIds([]);
  }, []);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Abrir/cerrar bottom sheet según visible
  useEffect(() => {
    if (visible) {
      setTempSelectedIds(selectedIds);
      setSearchQuery('');
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
      setKeyboardHeight(0);
    }
  }, [visible, selectedIds]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.bottomSheetBackground}
      topInset={insets.top}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={true}
      enableOverDrag={false}
      keyboardBehavior="fillParent"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
    >
      <View style={[styles.container, { paddingBottom: insets.bottom}]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.iconBox}>
              <Ionicons name={icon} size={24} color={Colors.primary} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={28} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Contador y acciones rápidas */}
        <View style={styles.actionBar}>
          <Text style={styles.counterText}>
            {tempSelectedIds.length} seleccionado{tempSelectedIds.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeselectAll} style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>Ninguno</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
    
        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, {paddingBottom: keyboardHeight * 1}]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Lista */}
          <View style={styles.listWrapper}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No se encontraron resultados' : emptyMessage}
                </Text>
              </View>
            ) : filteredItems.map((item) => {
                const isSelected = tempSelectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.listItem, isSelected && styles.listItemSelected]}
                    onPress={() => toggleItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={isSelected ? Colors.primary : Colors.textTertiary}
                    />
                    <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        </BottomSheetScrollView>

        {/* Botones de acción */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <View style={styles.confirmButtonContainer}>
            <Button
              title="Aplicar"
              onPress={handleConfirm}
              variant="primary"
              size="medium"
              icon="checkmark"
              iconPosition="left"
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: Colors.border,
    width: 40,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#fff',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.primary + '08',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  listWrapper: {
    flex: 1,
    minHeight: 200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  listItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  listItemTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#f8fafc',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  confirmButtonContainer: {
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
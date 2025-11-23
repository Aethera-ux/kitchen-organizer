import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Platform, Switch, Animated } from 'react-native';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useKitchen, InventoryItem } from '@/contexts/KitchenContext';
import { Plus, X, Package, Calendar, Search, SlidersHorizontal, Star, AlertTriangle, ShoppingBag } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const CATEGORIES = [
  { key: 'produce' as const, label: 'Produce', color: '#10b981' },
  { key: 'dairy' as const, label: 'Dairy', color: '#3b82f6' },
  { key: 'meat' as const, label: 'Meat', color: '#ef4444' },
  { key: 'pantry' as const, label: 'Pantry', color: '#f59e0b' },
  { key: 'other' as const, label: 'Other', color: '#8b5cf6' },
];

const UNITS = ['item', 'lbs', 'oz', 'kg', 'g', 'cup', 'tbsp', 'tsp', 'L', 'ml'];

type Category = 'produce' | 'dairy' | 'meat' | 'pantry' | 'other';
type FilterType = 'all' | Category | 'staples' | 'running-low';

export default function InventoryScreen() {
  const { addInventoryItem, updateInventoryItem, deleteInventoryItem, deleteMultipleInventoryItems, addShoppingItem, inventory } = useKitchen();
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const actionBarAnimation = useRef(new Animated.Value(0)).current;
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'item',
    category: 'pantry' as Category,
    expirationDate: '',
    isPantryStaple: false,
    isRunningLow: false,
    lowStockThreshold: '5',
    notes: '',
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      quantity: '1',
      unit: 'item',
      category: 'pantry',
      expirationDate: '',
      isPantryStaple: false,
      isRunningLow: false,
      lowStockThreshold: '5',
      notes: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      category: item.category,
      expirationDate: item.expirationDate || '',
      isPantryStaple: item.isPantryStaple || false,
      isRunningLow: item.isRunningLow || false,
      lowStockThreshold: item.lowStockThreshold?.toString() || '5',
      notes: item.notes || '',
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const itemData = {
      name: formData.name.trim(),
      quantity: parseFloat(formData.quantity) || 1,
      unit: formData.unit,
      category: formData.category,
      expirationDate: formData.expirationDate || undefined,
      isPantryStaple: formData.isPantryStaple,
      isRunningLow: formData.isRunningLow,
      lowStockThreshold: formData.isPantryStaple ? parseFloat(formData.lowStockThreshold) || 5 : undefined,
      notes: formData.notes || undefined,
    };

    if (editingItem) {
      updateInventoryItem(editingItem.id, itemData);
    } else {
      addInventoryItem(itemData);
    }

    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    deleteInventoryItem(id);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(current => 
      current.includes(id) 
        ? current.filter(i => i !== id)
        : [...current, id]
    );
  };

  const handleBatchDelete = () => {
    deleteMultipleInventoryItems(selectedItems);
    setSelectedItems([]);
    setIsSelectionMode(false);
  };

  const handleBatchAddToShopping = () => {
    selectedItems.forEach(id => {
      const item = inventory.find(i => i.id === id);
      if (item) {
        addShoppingItem({
          name: item.name,
          quantity: item.lowStockThreshold || 5,
          unit: item.unit,
          category: item.category as any,
          checked: false,
        });
      }
    });
    setSelectedItems([]);
    setIsSelectionMode(false);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === inventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inventory.map(i => i.id));
    }
  };

  useEffect(() => {
    Animated.timing(actionBarAnimation, {
      toValue: isSelectionMode ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelectionMode]);

  const addLowStockToShopping = (item: InventoryItem) => {
    addShoppingItem({
      name: item.name,
      quantity: item.lowStockThreshold || 5,
      unit: item.unit,
      category: item.category,
      checked: false,
    });
  };

  const filteredInventory = useMemo(() => {
    let filtered = inventory;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      if (filterCategory === 'staples') {
        filtered = filtered.filter(item => item.isPantryStaple);
      } else if (filterCategory === 'running-low') {
        filtered = filtered.filter(item => item.isRunningLow);
      } else {
        filtered = filtered.filter(item => item.category === filterCategory);
      }
    }

    const grouped: Record<Category, InventoryItem[]> = {
      produce: [],
      dairy: [],
      meat: [],
      pantry: [],
      other: [],
    };

    filtered.forEach(item => {
      grouped[item.category].push(item);
    });

    return grouped;
  }, [inventory, searchQuery, filterCategory]);

  const lowStockCount = inventory.filter(item => item.isRunningLow).length;
  const staplesCount = inventory.filter(item => item.isPantryStaple).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Kitchen Inventory', headerLargeTitle: true }} />
      
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search inventory..."
            placeholderTextColor={colors.placeholderText}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: colors.inputBackground }, showFilters && { backgroundColor: colors.primary + '10' }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={20} color={showFilters ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'staples' && styles.filterChipActive]}
            onPress={() => setFilterCategory('staples')}
          >
            <Star size={14} color={filterCategory === 'staples' ? '#10b981' : '#64748b'} />
            <Text style={[styles.filterChipText, filterCategory === 'staples' && styles.filterChipTextActive]}>
              Staples ({staplesCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'running-low' && styles.filterChipActive]}
            onPress={() => setFilterCategory('running-low')}
          >
            <AlertTriangle size={14} color={filterCategory === 'running-low' ? '#10b981' : '#64748b'} />
            <Text style={[styles.filterChipText, filterCategory === 'running-low' && styles.filterChipTextActive]}>
              Low Stock ({lowStockCount})
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.filterChip,
                filterCategory === cat.key && styles.filterChipActive,
                filterCategory === cat.key && { backgroundColor: cat.color + '20', borderColor: cat.color }
              ]}
              onPress={() => setFilterCategory(cat.key)}
            >
              <Text style={[
                styles.filterChipText,
                filterCategory === cat.key && { color: cat.color }
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {CATEGORIES.map(category => {
          const items = filteredInventory[category.key];
          if (items.length === 0) return null;

          return (
            <View key={category.key} style={styles.categorySection}>
              <View style={[styles.categoryHeader, { backgroundColor: category.color + '15' }]}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={[styles.categoryTitle, { color: category.color }]}>
                  {category.label}
                </Text>
                <Text style={styles.categoryCount}>{items.length}</Text>
              </View>

              {items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  onPress={() => openEditModal(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemLeft}>
                      {item.isPantryStaple && (
                        <Star size={16} color="#f59e0b" fill="#f59e0b" />
                      )}
                      <Package size={20} color="#64748b" />
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} {item.unit}
                    </Text>
                    {item.expirationDate && (
                      <View style={styles.expirationBadge}>
                        <Calendar size={12} color="#f59e0b" />
                        <Text style={styles.expirationText}>
                          Exp: {new Date(item.expirationDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {item.isRunningLow && (
                      <TouchableOpacity 
                        style={styles.lowStockBadge}
                        onPress={() => addLowStockToShopping(item)}
                      >
                        <AlertTriangle size={12} color="#ef4444" />
                        <Text style={styles.lowStockText}>Low</Text>
                        <ShoppingBag size={12} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        {Object.values(filteredInventory).every(arr => arr.length === 0) && inventory.length > 0 && (
          <View style={styles.emptyState}>
            <Search size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
          </View>
        )}

        {inventory.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyText}>Start tracking your kitchen inventory</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.8}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add Item'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Milk, Apples, Chicken"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Unit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                    {UNITS.map(unit => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitButton,
                          formData.unit === unit && styles.unitButtonActive,
                        ]}
                        onPress={() => setFormData({ ...formData, unit })}
                      >
                        <Text
                          style={[
                            styles.unitButtonText,
                            formData.unit === unit && styles.unitButtonTextActive,
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryButton,
                        formData.category === category.key && {
                          backgroundColor: category.color + '20',
                          borderColor: category.color,
                        },
                      ]}
                      onPress={() => setFormData({ ...formData, category: category.key })}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          formData.category === category.key && { color: category.color },
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Expiration Date (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.expirationDate}
                  onChangeText={(text) => setFormData({ ...formData, expirationDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <View style={styles.switchLeft}>
                    <Star size={20} color="#f59e0b" />
                    <View>
                      <Text style={styles.switchLabel}>Pantry Staple</Text>
                      <Text style={styles.switchDescription}>Always keep on hand</Text>
                    </View>
                  </View>
                  <Switch
                    value={formData.isPantryStaple}
                    onValueChange={(value) => setFormData({ ...formData, isPantryStaple: value })}
                    trackColor={{ false: '#cbd5e1', true: '#10b98160' }}
                    thumbColor={formData.isPantryStaple ? '#10b981' : '#f1f5f9'}
                  />
                </View>
              </View>

              {formData.isPantryStaple && (
                <>
                  <View style={styles.formGroup}>
                    <View style={styles.switchRow}>
                      <View style={styles.switchLeft}>
                        <AlertTriangle size={20} color="#ef4444" />
                        <View>
                          <Text style={styles.switchLabel}>Running Low</Text>
                          <Text style={styles.switchDescription}>Add to shopping list</Text>
                        </View>
                      </View>
                      <Switch
                        value={formData.isRunningLow}
                        onValueChange={(value) => setFormData({ ...formData, isRunningLow: value })}
                        trackColor={{ false: '#cbd5e1', true: '#ef444460' }}
                        thumbColor={formData.isRunningLow ? '#ef4444' : '#f1f5f9'}
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Low Stock Threshold</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.lowStockThreshold}
                      onChangeText={(text) => setFormData({ ...formData, lowStockThreshold: text })}
                      keyboardType="numeric"
                      placeholder="5"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSave}
              >
                <Text style={styles.buttonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#10b98110',
  },
  filterScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#10b98110',
    borderColor: '#10b981',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: '#10b981',
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600' as const,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      } as any,
    }),
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  expirationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expirationText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500' as const,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      } as any,
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unitScroll: {
    flexDirection: 'row',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  unitButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#f1f5f9',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  buttonPrimary: {
    backgroundColor: '#10b981',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});

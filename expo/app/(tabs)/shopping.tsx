import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { useKitchen, useShoppingByCategory } from '@/contexts/KitchenContext';
import { Plus, X, ShoppingBag, Check, Calendar as CalendarIcon, RefreshCw, ChevronRight } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const STORE_SECTIONS = [
  { key: 'produce' as const, label: 'Produce', color: '#10b981' },
  { key: 'meat' as const, label: 'Meat & Seafood', color: '#ef4444' },
  { key: 'dairy' as const, label: 'Dairy', color: '#3b82f6' },
  { key: 'pantry' as const, label: 'Pantry', color: '#f59e0b' },
  { key: 'frozen' as const, label: 'Frozen', color: '#06b6d4' },
  { key: 'bakery' as const, label: 'Bakery', color: '#a855f7' },
  { key: 'beverages' as const, label: 'Beverages', color: '#ec4899' },
  { key: 'other' as const, label: 'Other', color: '#8b5cf6' },
];

const UNITS = ['item', 'lbs', 'oz', 'kg', 'g', 'cup', 'tbsp', 'tsp', 'L', 'ml'];

export default function ShoppingScreen() {
  const {
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCheckedShoppingItems,
    checkInventoryForItem,
    generateShoppingListFromMealPlan,
    meals,
    shoppingConfig,
    shoppingList,
  } = useKitchen();
  const { colors, isDark } = useTheme();
  const shoppingByCategory = useShoppingByCategory();
  const [modalVisible, setModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [selectedEndDate, setSelectedEndDate] = useState<string>('');
  const [shoppingMode, setShoppingMode] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    name: string;
    quantity: string;
    unit: string;
    category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'beverages' | 'other';
    notes?: string;
  }>({
    name: '',
    quantity: '1',
    unit: 'item',
    category: 'pantry',
    notes: '',
  });

  const availableDates = useMemo(() => {
    const uniqueDates = Array.from(new Set(meals.map(m => m.date))).sort();
    return uniqueDates;
  }, [meals]);

  const openAddModal = () => {
    setFormData({
      name: '',
      quantity: '1',
      unit: 'item',
      category: 'pantry',
      notes: '',
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
      checked: false,
      notes: formData.notes?.trim() || undefined,
    };

    addShoppingItem(itemData);
    setModalVisible(false);
  };

  const handleToggle = (id: string) => {
    toggleShoppingItem(id);
  };

  const handleDelete = (id: string) => {
    deleteShoppingItem(id);
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(current =>
      current.includes(section) 
        ? current.filter(s => s !== section)
        : [...current, section]
    );
  };

  const handleUncheckAll = () => {
    shoppingList.forEach(item => {
      if (item.checked) {
        toggleShoppingItem(item.id);
      }
    });
  };

  const allItems = Object.values(shoppingByCategory).flat();
  const checkedCount = allItems.filter(item => item.checked).length;
  const totalCount = allItems.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Shopping List', headerLargeTitle: true }} />

      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {shoppingConfig.autoUpdate && shoppingConfig.startDate && shoppingConfig.endDate && (
          <View style={[styles.autoUpdateBanner, { backgroundColor: colors.primary + '10' }]}>
            <RefreshCw size={16} color={colors.primary} />
            <Text style={[styles.autoUpdateText, { color: colors.primary }]}>
              Auto-updating: {new Date(shoppingConfig.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(shoppingConfig.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        )}
        
        <View style={styles.toolbarRow}>
          <TouchableOpacity
            style={[styles.modeButton, shoppingMode && { backgroundColor: colors.primary + '20' }]}
            onPress={() => setShoppingMode(!shoppingMode)}
            activeOpacity={0.8}
          >
            <ShoppingBag size={18} color={shoppingMode ? colors.primary : colors.textSecondary} />
            <Text style={[styles.modeButtonText, { color: shoppingMode ? colors.primary : colors.text }]}>
              {shoppingMode ? 'Shopping' : 'Planning'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
            onPress={() => setDateModalVisible(true)}
            activeOpacity={0.8}
          >
            <CalendarIcon size={18} color={colors.primary} />
            <Text style={[styles.generateButtonText, { color: colors.primary }]}>Generate</Text>
          </TouchableOpacity>
        </View>

        {checkedCount > 0 && (
          <View style={styles.toolbarActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.error + '10' }]}
              onPress={clearCheckedShoppingItems}
            >
              <Text style={[styles.actionButtonText, { color: colors.error }]}>
                Clear Checked ({checkedCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.surfaceElevated }]}
              onPress={handleUncheckAll}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Uncheck All
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {totalCount > 0 && shoppingMode && (
        <View style={[styles.progress, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {checkedCount} of {totalCount} items
            </Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {Math.round((checkedCount / totalCount) * 100)}%
            </Text>
          </View>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.surfaceElevated }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(checkedCount / totalCount) * 100}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {STORE_SECTIONS.map(section => {
          const items = shoppingByCategory[section.key] || [];
          if (items.length === 0) return null;

          const uncheckedItems = items.filter(item => !item.checked);
          const checkedItems = items.filter(item => item.checked);
          const sortedItems = shoppingMode ? [...uncheckedItems, ...checkedItems] : items;
          const isCollapsed = collapsedSections.includes(section.key);

          return (
            <View key={section.key} style={styles.categorySection}>
              <TouchableOpacity
                style={[styles.categoryHeader, { backgroundColor: section.color + '15' }]}
                onPress={() => toggleSection(section.key)}
              >
                <View style={[styles.categoryDot, { backgroundColor: section.color }]} />
                <Text style={[styles.categoryTitle, { color: section.color }]}>
                  {section.label}
                </Text>
                <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                  {uncheckedItems.length}/{items.length}
                </Text>
                <ChevronRight 
                  size={20} 
                  color={colors.textSecondary} 
                  style={{ transform: [{ rotate: isCollapsed ? '0deg' : '90deg' }] }}
                />
              </TouchableOpacity>

              {!isCollapsed && sortedItems.map(item => {
                const inventoryItem = checkInventoryForItem(item.name);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.itemCard, 
                      { backgroundColor: colors.surface },
                      item.checked && styles.itemCardChecked
                    ]}
                    onPress={() => shoppingMode && handleToggle(item.id)}
                    activeOpacity={shoppingMode ? 0.7 : 1}
                  >
                    <View style={styles.itemLeft}>
                      {shoppingMode && (
                        <TouchableOpacity
                          onPress={() => handleToggle(item.id)}
                          style={[
                            styles.checkbox, 
                            { borderColor: colors.border },
                            item.checked && { backgroundColor: colors.primary, borderColor: colors.primary }
                          ]}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          {item.checked && <Check size={16} color="#fff" strokeWidth={3} />}
                        </TouchableOpacity>
                      )}

                      <View style={styles.itemInfo}>
                        <Text style={[
                          styles.itemName, 
                          { color: colors.text },
                          item.checked && styles.itemNameChecked
                        ]}>
                          {item.name}
                        </Text>
                        <View style={styles.itemMeta}>
                          <Text style={[
                            styles.itemQuantity, 
                            { color: colors.textSecondary },
                            item.checked && styles.itemQuantityChecked
                          ]}>
                            {item.quantity} {item.unit}
                          </Text>
                          {inventoryItem && !item.checked && (
                            <Text style={[styles.inventoryNote, { color: colors.success }]}>
                              • In stock: {inventoryItem.quantity} {inventoryItem.unit}
                            </Text>
                          )}
                        </View>
                        {item.notes && (
                          <Text style={[styles.itemNotes, { color: colors.textTertiary }]}>
                            {item.notes}
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={18} color={colors.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {allItems.length === 0 && (
          <View style={styles.emptyState}>
            <ShoppingBag size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your list is empty</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add items you need to buy</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        onPress={openAddModal} 
        activeOpacity={0.8}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={dateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {availableDates.length === 0 ? (
                <View style={styles.emptyDateState}>
                  <Text style={[styles.emptyDateText, { color: colors.text }]}>No meals planned yet</Text>
                  <Text style={[styles.emptyDateSubtext, { color: colors.textSecondary }]}>Add meals to your plan first</Text>
                </View>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
                    <View style={styles.dateOptions}>
                      {availableDates.map(date => (
                        <TouchableOpacity
                          key={date}
                          style={[
                            styles.dateChip,
                            { borderColor: colors.border, backgroundColor: colors.surface },
                            selectedStartDate === date && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => setSelectedStartDate(date)}
                        >
                          <Text
                            style={[
                              styles.dateChipText,
                              { color: colors.textSecondary },
                              selectedStartDate === date && { color: '#fff' },
                            ]}
                          >
                            {new Date(date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
                    <View style={styles.dateOptions}>
                      {availableDates
                        .filter(date => !selectedStartDate || date >= selectedStartDate)
                        .map(date => (
                          <TouchableOpacity
                            key={date}
                            style={[
                              styles.dateChip,
                              { borderColor: colors.border, backgroundColor: colors.surface },
                              selectedEndDate === date && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => setSelectedEndDate(date)}
                          >
                            <Text
                              style={[
                                styles.dateChipText,
                                { color: colors.textSecondary },
                                selectedEndDate === date && { color: '#fff' },
                              ]}
                            >
                              {new Date(date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => {
                  generateShoppingListFromMealPlan();
                  setDateModalVisible(false);
                }}
              >
                <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>All Meals</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (selectedStartDate && selectedEndDate) {
                    generateShoppingListFromMealPlan(selectedStartDate, selectedEndDate);
                    setSelectedStartDate('');
                    setSelectedEndDate('');
                    setDateModalVisible(false);
                  }
                }}
                disabled={!selectedStartDate || !selectedEndDate}
              >
                <Text style={[styles.buttonPrimaryText, (!selectedStartDate || !selectedEndDate) && { opacity: 0.5 }]}>
                  Generate
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Item</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Milk, Apples, Chicken"
                  placeholderTextColor={colors.placeholderText}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: colors.text }]}>Quantity *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={colors.placeholderText}
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                    {UNITS.map(unit => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitButton,
                          { borderColor: colors.border, backgroundColor: colors.surface },
                          formData.unit === unit && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setFormData({ ...formData, unit })}
                      >
                        <Text
                          style={[
                            styles.unitButtonText,
                            { color: colors.textSecondary },
                            formData.unit === unit && { color: '#fff' },
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
                <Text style={[styles.label, { color: colors.text }]}>Section</Text>
                <View style={styles.categoryGrid}>
                  {STORE_SECTIONS.map(section => (
                    <TouchableOpacity
                      key={section.key}
                      style={[
                        styles.categoryButton,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                        formData.category === section.key && {
                          backgroundColor: section.color + '20',
                          borderColor: section.color,
                        },
                      ]}
                      onPress={() => setFormData({ ...formData, category: section.key as any })}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          { color: colors.textSecondary },
                          formData.category === section.key && { color: section.color },
                        ]}
                      >
                        {section.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="e.g., Organic, Brand X, etc."
                  placeholderTextColor={colors.placeholderText}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.buttonPrimaryText}>Add</Text>
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
  },
  toolbar: {
    padding: 12,
    borderBottomWidth: 1,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  progress: {
    padding: 16,
    borderBottomWidth: 1,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  categorySection: {
    marginBottom: 20,
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
    fontWeight: '600' as const,
    marginRight: 8,
  },
  itemCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)' as any,
      },
    }),
  },
  itemCardChecked: {
    opacity: 0.6,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through' as const,
    opacity: 0.7,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQuantity: {
    fontSize: 13,
  },
  itemQuantityChecked: {
    opacity: 0.7,
  },
  inventoryNote: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  itemNotes: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
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
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)' as any,
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
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
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  unitScroll: {
    flexDirection: 'row',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
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
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {},
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonPrimary: {},
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  dateOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  emptyDateState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyDateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  emptyDateSubtext: {
    fontSize: 14,
  },
  autoUpdateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  autoUpdateText: {
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
  },
});
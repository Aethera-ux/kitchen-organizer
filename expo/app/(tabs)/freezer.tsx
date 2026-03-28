import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { useKitchen, FreezerMeal } from '@/contexts/KitchenContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, X, Snowflake, ChefHat } from 'lucide-react-native';
import { Stack } from 'expo-router';

export default function FreezerScreen() {
  const { freezerMeals, addFreezerMeal, updateFreezerMeal, deleteFreezerMeal, recipes } = useKitchen();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<FreezerMeal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    prepDate: new Date().toISOString().split('T')[0],
    servings: '4',
    notes: '',
    recipeId: '',
  });

  const openAddModal = () => {
    setEditingMeal(null);
    setFormData({
      name: '',
      prepDate: new Date().toISOString().split('T')[0],
      servings: '4',
      notes: '',
      recipeId: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (meal: FreezerMeal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      prepDate: meal.prepDate,
      servings: meal.servings.toString(),
      notes: meal.notes || '',
      recipeId: '',
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const mealData = {
      name: formData.name.trim(),
      prepDate: formData.prepDate,
      servings: parseInt(formData.servings) || 1,
      notes: formData.notes.trim() || undefined,
    };

    if (editingMeal) {
      updateFreezerMeal(editingMeal.id, mealData);
    } else {
      addFreezerMeal(mealData);
    }

    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    deleteFreezerMeal(id);
  };

  const groupedMeals = useMemo(() => {
    const groups = new Map<string, FreezerMeal[]>();
    freezerMeals.forEach(meal => {
      const key = meal.name.toLowerCase().trim();
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(meal);
    });
    
    const sortedGroups = Array.from(groups.entries()).map(([name, meals]) => ({
      name: meals[0].name,
      meals: meals.sort((a, b) => new Date(b.prepDate).getTime() - new Date(a.prepDate).getTime()),
      count: meals.length,
      totalServings: meals.reduce((sum, m) => sum + m.servings, 0),
      oldestDate: meals.reduce((oldest, m) => 
        new Date(m.prepDate) < new Date(oldest.prepDate) ? m : oldest
      ).prepDate,
    }));
    
    return sortedGroups.sort((a, b) => 
      new Date(b.oldestDate).getTime() - new Date(a.oldestDate).getTime()
    );
  }, [freezerMeals]);

  const getDaysInFreezer = (prepDate: string) => {
    const now = new Date();
    const prep = new Date(prepDate);
    const diffTime = Math.abs(now.getTime() - prep.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const styles = getStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Freezer Meals', headerLargeTitle: true }} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {groupedMeals.map((group, groupIndex) => {
          const oldestDays = getDaysInFreezer(group.oldestDate);
          
          return (
            <View key={`group-${groupIndex}`} style={styles.mealGroup}>
              <View style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealLeft}>
                    <View style={styles.iconCircle}>
                      <Snowflake size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.mealInfo}>
                      <View style={styles.mealNameRow}>
                        <Text style={styles.mealName}>{group.name}</Text>
                        {group.count > 1 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>×{group.count}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.mealServings}>{group.totalServings} total servings</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.mealDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Oldest prepared:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(group.oldestDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>In freezer:</Text>
                    <Text style={styles.detailValue}>
                      {oldestDays} {oldestDays === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                </View>

                <View style={styles.individualMealsContainer}>
                  <Text style={styles.individualMealsTitle}>Individual Meals:</Text>
                  {group.meals.map((meal, idx) => {
                    const daysInFreezer = getDaysInFreezer(meal.prepDate);
                    return (
                      <View key={meal.id} style={styles.individualMeal}>
                        <View style={styles.individualMealInfo}>
                          <Text style={styles.individualMealText}>
                            Meal {idx + 1}: {meal.servings} servings
                          </Text>
                          <Text style={styles.individualMealDate}>
                            {new Date(meal.prepDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })} • {daysInFreezer}d
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(meal.id)}
                          style={styles.deleteButtonSmall}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}

        {freezerMeals.length === 0 && (
          <View style={styles.emptyState}>
            <Snowflake size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No freezer meals</Text>
            <Text style={styles.emptyText}>Start tracking your prepared meals</Text>
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
                {editingMeal ? 'Edit Freezer Meal' : 'Add Freezer Meal'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {!editingMeal && recipes.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Link Recipe (Optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipeScroll}>
                    <TouchableOpacity
                      style={[
                        styles.recipeChip,
                        !formData.recipeId && styles.recipeChipActive,
                      ]}
                      onPress={() => setFormData({ ...formData, recipeId: '', name: '', notes: '' })}
                    >
                      <Text
                        style={[
                          styles.recipeChipText,
                          !formData.recipeId && styles.recipeChipTextActive,
                        ]}
                      >
                        None
                      </Text>
                    </TouchableOpacity>
                    {recipes.map(recipe => (
                      <TouchableOpacity
                        key={recipe.id}
                        style={[
                          styles.recipeChip,
                          formData.recipeId === recipe.id && styles.recipeChipActive,
                        ]}
                        onPress={() => {
                          const ingredients = recipe.ingredients.map(ing => 
                            `${ing.quantity} ${ing.unit} ${ing.name}`
                          ).join(', ');
                          setFormData({ 
                            ...formData, 
                            recipeId: recipe.id, 
                            name: recipe.name,
                            servings: recipe.servings.toString(),
                            notes: recipe.instructions || ingredients
                          });
                        }}
                      >
                        <ChefHat size={14} color={formData.recipeId === recipe.id ? '#fff' : colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text
                          style={[
                            styles.recipeChipText,
                            formData.recipeId === recipe.id && styles.recipeChipTextActive,
                          ]}
                        >
                          {recipe.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Meal Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Lasagna, Chicken Curry"
                  placeholderTextColor={colors.placeholderText}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Servings *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.servings}
                    onChangeText={(text) => setFormData({ ...formData, servings: text })}
                    keyboardType="numeric"
                    placeholder="4"
                    placeholderTextColor={colors.placeholderText}
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Prep Date *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.prepDate}
                    onChangeText={(text) => setFormData({ ...formData, prepDate: text })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.placeholderText}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Reheating instructions, ingredients, etc."
                  placeholderTextColor={colors.placeholderText}
                  multiline
                  numberOfLines={4}
                />
              </View>
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

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  mealGroup: {
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
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
      },
    }),
  },
  mealNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  individualMealsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  individualMealsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  individualMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 6,
  },
  individualMealInfo: {
    flex: 1,
  },
  individualMealText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: 2,
  },
  individualMealDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButtonSmall: {
    padding: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  mealServings: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  mealDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
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
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
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
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
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
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.inputBackground,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  recipeScroll: {
    flexDirection: 'row',
  },
  recipeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  recipeChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  recipeChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
  },
  recipeChipTextActive: {
    color: '#fff',
  },
});

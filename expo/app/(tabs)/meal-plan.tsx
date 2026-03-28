import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Platform, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import { useKitchen, MealPlan } from '@/contexts/KitchenContext';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Crown, AlertCircle, AlertTriangle, Snowflake } from 'lucide-react-native';
import { Stack, router } from 'expo-router';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useTheme } from '@/contexts/ThemeContext';

const MEAL_TYPES = [
  { key: 'breakfast' as const, label: 'Breakfast', color: '#f59e0b' },
  { key: 'lunch' as const, label: 'Lunch', color: '#10b981' },
  { key: 'dinner' as const, label: 'Dinner', color: '#3b82f6' },
  { key: 'snack' as const, label: 'Snack', color: '#8b5cf6' },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function MealPlanScreen() {
  const { meals, recipes, freezerMeals, addMealPlan, updateMealPlan, deleteMealPlan, checkInventoryForRecipe } = useKitchen();
  const { isPro } = useRevenueCat();
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    notes: string;
    recipeId: string;
  }>({
    name: '',
    mealType: 'dinner',
    notes: '',
    recipeId: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const mealsByDate = useMemo(() => {
    const map: Record<string, MealPlan[]> = {};
    meals.forEach(meal => {
      if (!map[meal.date]) map[meal.date] = [];
      map[meal.date].push(meal);
    });
    return map;
  }, [meals]);

  const openAddModal = (date: string) => {
    if (!isPro) {
      const mealDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((mealDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 14) {
        Alert.alert(
          'Upgrade to Pro',
          'Free tier is limited to planning 14 days ahead. Upgrade to unlock unlimited meal planning!',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/paywall') }
          ]
        );
        return;
      }
    }
    
    setSelectedDate(date);
    setEditingMeal(null);
    setFormData({ name: '', mealType: 'dinner', notes: '', recipeId: '' });
    setModalVisible(true);
  };

  const openEditModal = (meal: MealPlan) => {
    setSelectedDate(meal.date);
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      mealType: meal.mealType,
      notes: meal.notes || '',
      recipeId: meal.recipeId || '',
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const mealData = {
      date: selectedDate,
      name: formData.name.trim(),
      mealType: formData.mealType,
      notes: formData.notes.trim() || undefined,
      recipeId: formData.recipeId || undefined,
    };

    if (editingMeal) {
      const success = updateMealPlan(editingMeal.id, mealData, isPro);
      if (success) {
        setModalVisible(false);
      } else {
        Alert.alert(
          'Upgrade to Pro',
          'Free tier is limited to planning 14 days ahead. Upgrade to unlock unlimited meal planning!',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => {
              setModalVisible(false);
              router.push('/paywall');
            }}
          ]
        );
      }
    } else {
      const success = addMealPlan(mealData, isPro);
      if (success) {
        setModalVisible(false);
      } else {
        Alert.alert(
          'Upgrade to Pro',
          'Free tier is limited to planning 14 days ahead. Upgrade to unlock unlimited meal planning!',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => {
              setModalVisible(false);
              router.push('/paywall');
            }}
          ]
        );
      }
    }
  };

  const handleDelete = (id: string) => {
    deleteMealPlan(id);
  };

  const previousMonth = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const nextMonth = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Calculate week range
  const getWeekRange = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = formatDate(date.getDate());
      const fullDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayMeals = mealsByDate[fullDateStr] || [];
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      
      days.push({
        date,
        dateStr: fullDateStr,
        dayMeals,
        isToday,
        isPast,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    
    return (
      <View style={[styles.weekView, { backgroundColor: colors.cardBackground }]}>
        <ScrollView style={styles.weekDaysContainer} showsVerticalScrollIndicator={false}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekDayCard,
                { backgroundColor: colors.background, borderColor: colors.border },
                day.isToday && styles.weekDayToday,
                day.isPast && styles.weekDayPast
              ]}
              onPress={() => !day.isPast && openAddModal(day.dateStr)}
              activeOpacity={day.isPast ? 1 : 0.7}
              disabled={day.isPast}
            >
              <View style={styles.weekDayHeader}>
                <Text style={[styles.weekDayName, { color: colors.text }, day.isToday && styles.weekDayNameToday]}>
                  {day.dayName}
                </Text>
                <Text style={[styles.weekDayNum, { color: colors.text }, day.isToday && styles.weekDayNumToday]}>
                  {day.dayNum}
                </Text>
                <Text style={[styles.weekDayMonth, { color: colors.textSecondary }]}>
                  {day.monthName}
                </Text>
              </View>
              
              <View style={styles.weekDayMeals}>
                {day.dayMeals.length > 0 ? (
                  day.dayMeals.map((meal, mealIdx) => {
                    const mealType = MEAL_TYPES.find(t => t.key === meal.mealType);
                    return (
                      <TouchableOpacity
                        key={mealIdx}
                        style={[
                          styles.weekMealItem,
                          { backgroundColor: mealType?.color + '15', borderLeftColor: mealType?.color }
                        ]}
                        onPress={() => openEditModal(meal)}
                      >
                        <Text style={[styles.weekMealType, { color: mealType?.color }]}>
                          {mealType?.label}
                        </Text>
                        <Text style={[styles.weekMealName, { color: colors.text }]} numberOfLines={1}>
                          {meal.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.weekDayEmpty}>
                    <Text style={[styles.weekDayEmptyText, { color: colors.textSecondary }]}>
                      {day.isPast ? 'No meals' : 'Tap to add meal'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Meal Planning', headerLargeTitle: true }} />

      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'month' && [styles.viewToggleActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[
              styles.viewToggleText,
              { color: viewMode === 'month' ? '#fff' : colors.text }
            ]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'week' && [styles.viewToggleActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[
              styles.viewToggleText,
              { color: viewMode === 'week' ? '#fff' : colors.text }
            ]}>
              Week
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {viewMode === 'week' ? getWeekRange() : monthName}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {viewMode === 'month' ? (
          <View style={[styles.calendar, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={[styles.weekDay, { color: colors.textSecondary }]}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {Array.from({ length: firstDay }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.dayCell} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dateStr = formatDate(day);
                const dayMeals = mealsByDate[dateStr] || [];
                const isToday = 
                  day === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const cellDate = new Date(year, month, day);
                const isPast = cellDate < today;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCell, isToday && styles.today, isPast && styles.pastDay]}
                    onPress={() => !isPast && openAddModal(dateStr)}
                    activeOpacity={isPast ? 1 : 0.7}
                    disabled={isPast}
                  >
                    <Text style={[
                      styles.dayNumber,
                      { color: colors.text },
                      isToday && styles.todayText,
                      isPast && [styles.pastDayText, { color: colors.textSecondary }]
                    ]}>
                      {day}
                    </Text>
                    {dayMeals.length > 0 && (
                      <View style={styles.mealDots}>
                        {dayMeals.slice(0, 4).map((meal, idx) => {
                          const mealType = MEAL_TYPES.find(t => t.key === meal.mealType);
                          return (
                            <View
                              key={`${meal.id}-${idx}`}
                              style={[styles.mealDot, { backgroundColor: mealType?.color || '#94a3b8' }]}
                            />
                          );
                        })}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          renderWeekView()
        )}

        <View style={styles.mealsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Meals</Text>
          {(() => {
            const upcomingMeals = meals
              .filter(meal => new Date(meal.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 10);
            
            const freezerUsageMap = new Map<string, number>();
            
            return upcomingMeals.map(meal => {
              const mealType = MEAL_TYPES.find(t => t.key === meal.mealType);
              let inventoryStatus = null;
              if (meal.recipeId) {
                inventoryStatus = checkInventoryForRecipe(meal.recipeId);
              }
              
              const mealKey = meal.name.toLowerCase().trim();
              const totalFreezerCount = freezerMeals.filter(fm => fm.name.toLowerCase().trim() === mealKey).length;
              const usedCount = freezerUsageMap.get(mealKey) || 0;
              const hasFreezerMeal = usedCount < totalFreezerCount;
              
              if (hasFreezerMeal) {
                freezerUsageMap.set(mealKey, usedCount + 1);
              }
              
              return (
                <TouchableOpacity
                  key={meal.id}
                  style={[styles.mealCard, { backgroundColor: colors.cardBackground }]}
                  onPress={() => openEditModal(meal)}
                  activeOpacity={0.7}
                >
                  <View style={styles.mealHeader}>
                    <View style={[styles.mealTypeBadge, { backgroundColor: mealType?.color + '20' }]}>
                      <Text style={[styles.mealTypeText, { color: mealType?.color }]}>
                        {mealType?.label}
                      </Text>
                    </View>
                    <View style={styles.mealHeaderRight}>
                      {hasFreezerMeal && (
                        <View style={styles.freezerBadge}>
                          <Snowflake size={14} color="#3b82f6" />
                          <Text style={styles.freezerBadgeText}>In Freezer</Text>
                        </View>
                      )}
                      {inventoryStatus && inventoryStatus.missingItems.length > 0 && !hasFreezerMeal && (
                        <View style={styles.statusBadge}>
                          <AlertCircle size={14} color="#ef4444" />
                          <Text style={styles.statusText}>{inventoryStatus.missingItems.length}</Text>
                        </View>
                      )}
                      {inventoryStatus && inventoryStatus.missingItems.length === 0 && inventoryStatus.lowStockItems.length > 0 && !hasFreezerMeal && (
                        <View style={[styles.statusBadge, styles.statusBadgeWarning]}>
                          <AlertTriangle size={14} color="#f59e0b" />
                          <Text style={[styles.statusText, styles.statusTextWarning]}>{inventoryStatus.lowStockItems.length}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDelete(meal.id)}
                        style={styles.deleteButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <X size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                  <Text style={[styles.mealDate, { color: colors.textSecondary }]}>
                    {new Date(meal.date).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                  {meal.notes && <Text style={[styles.mealNotes, { color: colors.textSecondary }]}>{meal.notes}</Text>}
                  
                  {hasFreezerMeal && (
                    <View style={styles.freezerInfo}>
                      <Snowflake size={16} color="#3b82f6" />
                      <Text style={styles.freezerInfoText}>
                        Using freezer meal - no shopping needed!
                      </Text>
                    </View>
                  )}
                  
                  {!hasFreezerMeal && inventoryStatus && meal.recipeId && (
                    <View style={styles.inventoryInfo}>
                      {inventoryStatus.missingItems.length > 0 && (
                        <View style={styles.inventoryAlert}>
                          <AlertCircle size={16} color="#ef4444" />
                          <Text style={styles.inventoryAlertText}>
                            {inventoryStatus.missingItems.length} missing: {inventoryStatus.missingItems.slice(0, 2).map(i => i.name).join(', ')}{inventoryStatus.missingItems.length > 2 ? '...' : ''}
                          </Text>
                        </View>
                      )}
                      {inventoryStatus.missingItems.length === 0 && inventoryStatus.lowStockItems.length > 0 && (
                        <View style={styles.inventoryWarning}>
                          <AlertTriangle size={16} color="#f59e0b" />
                          <Text style={styles.inventoryWarningText}>
                            {inventoryStatus.lowStockItems.length} running low: {inventoryStatus.lowStockItems.slice(0, 2).map(i => i.name).join(', ')}{inventoryStatus.lowStockItems.length > 2 ? '...' : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            });
          })()}

          {meals.filter(meal => new Date(meal.date) >= new Date(new Date().setHours(0, 0, 0, 0))).length === 0 && (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming meals planned</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingMeal ? 'Edit Meal' : 'Add Meal'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Date</Text>
                <Text style={[styles.dateDisplay, { backgroundColor: colors.inputBackground, color: colors.text }]}>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Link Recipe (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipeScroll}>
                  <TouchableOpacity
                    style={[
                      styles.recipeChip,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      !formData.recipeId && styles.recipeChipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, recipeId: '' })}
                  >
                    <Text
                      style={[
                        styles.recipeChipText,
                        { color: colors.textSecondary },
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
                        { backgroundColor: colors.background, borderColor: colors.border },
                        formData.recipeId === recipe.id && styles.recipeChipActive,
                      ]}
                      onPress={() => setFormData({ ...formData, recipeId: recipe.id, name: recipe.name })}
                    >
                      <Text
                        style={[
                          styles.recipeChipText,
                          { color: colors.textSecondary },
                          formData.recipeId === recipe.id && styles.recipeChipTextActive,
                        ]}
                      >
                        {recipe.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Meal Type</Text>
                <View style={styles.mealTypeGrid}>
                  {MEAL_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.mealTypeButton,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        formData.mealType === type.key && {
                          backgroundColor: type.color + '20',
                          borderColor: type.color,
                        },
                      ]}
                      onPress={() => setFormData({ ...formData, mealType: type.key as 'breakfast' | 'lunch' | 'dinner' | 'snack' })}
                    >
                      <Text
                        style={[
                          styles.mealTypeButtonText,
                          formData.mealType === type.key && { color: type.color },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Meal Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Grilled Chicken & Vegetables"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Add notes about prep, ingredients, etc."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.background }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonSecondaryText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, { backgroundColor: colors.primary }]}
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
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  viewToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  viewToggleActive: {
    backgroundColor: '#10b981',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  calendar: {
    padding: 16,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    backgroundColor: '#10b98110',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  todayText: {
    color: '#10b981',
    fontWeight: '700' as const,
  },
  pastDay: {
    opacity: 0.4,
  },
  pastDayText: {
    fontWeight: '400' as const,
  },
  mealDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  mealDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  weekView: {
    padding: 16,
  },
  weekDaysContainer: {
    maxHeight: 500,
  },
  weekDayCard: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  weekDayToday: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  weekDayPast: {
    opacity: 0.5,
  },
  weekDayHeader: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  weekDayNameToday: {
    color: '#10b981',
  },
  weekDayNum: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginVertical: 2,
  },
  weekDayNumToday: {
    color: '#10b981',
  },
  weekDayMonth: {
    fontSize: 11,
  },
  weekDayMeals: {
    flex: 1,
  },
  weekMealItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  weekMealType: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  weekMealName: {
    fontSize: 14,
  },
  weekDayEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  weekDayEmptyText: {
    fontSize: 13,
    fontStyle: 'italic' as const,
  },
  mealsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  mealCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mealHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeWarning: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ef4444',
  },
  statusTextWarning: {
    color: '#f59e0b',
  },
  freezerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freezerBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3b82f6',
  },
  freezerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#dbeafe',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  freezerInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500' as const,
  },
  inventoryInfo: {
    marginTop: 12,
    gap: 6,
  },
  inventoryAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
  },
  inventoryAlertText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500' as const,
  },
  inventoryWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
  },
  inventoryWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '500' as const,
  },
  mealTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  deleteButton: {
    padding: 4,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  mealDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  mealNotes: {
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
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
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  dateDisplay: {
    fontSize: 16,
    padding: 14,
    borderRadius: 12,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  mealTypeButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
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
  },
  buttonPrimary: {
    backgroundColor: '#10b981',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  recipeChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  recipeChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  recipeChipTextActive: {
    color: '#fff',
  },
});
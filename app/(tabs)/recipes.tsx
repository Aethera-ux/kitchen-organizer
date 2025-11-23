import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Platform, Alert, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useKitchen, Recipe, Ingredient, MacroNutrients } from '@/contexts/KitchenContext';
import { Plus, X, ChefHat, Trash2, Crown, Settings, Search, SlidersHorizontal, Star, Globe } from 'lucide-react-native';
import { Stack, router } from 'expo-router';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useTheme } from '@/contexts/ThemeContext';

const CATEGORIES = [
  { key: 'produce' as const, label: 'Produce', color: '#10b981' },
  { key: 'dairy' as const, label: 'Dairy', color: '#3b82f6' },
  { key: 'meat' as const, label: 'Meat', color: '#ef4444' },
  { key: 'pantry' as const, label: 'Pantry', color: '#f59e0b' },
  { key: 'other' as const, label: 'Other', color: '#8b5cf6' },
];

const UNITS = ['item', 'lbs', 'oz', 'kg', 'g', 'cup', 'tbsp', 'tsp', 'L', 'ml'];

const SPOONACULAR_API_KEY = '763cfc1cfa63452fa666ce0891ccf84f';

type Category = 'produce' | 'dairy' | 'meat' | 'pantry' | 'other';

export default function RecipesScreen() {
  const { recipes, addRecipe, updateRecipe, deleteRecipe } = useKitchen();
  const { isPro, isLoading: revenueCatLoading } = useRevenueCat();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'produce' | 'dairy' | 'meat' | 'pantry' | 'other' | 'favorites'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showApiSearch, setShowApiSearch] = useState(false);
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    servings: '4',
    prepTime: '',
    instructions: '',
  });
  const [ingredients, setIngredients] = useState<(Omit<Ingredient, 'id'> & { quantity: number | string })[]>([
    { quantity: 1, unit: 'item', name: '', category: 'pantry' }
  ]);
  const [macros, setMacros] = useState<MacroNutrients>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>([]);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState<number | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const openAddModal = () => {
    setEditingRecipe(null);
    setFormData({ name: '', servings: '4', prepTime: '', instructions: '' });
    setIngredients([{ quantity: 1, unit: 'item', name: '', category: 'pantry' }]);
    setMacros({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    setModalVisible(true);
  };

  const openEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      servings: recipe.servings.toString(),
      prepTime: recipe.prepTime || '',
      instructions: recipe.instructions || '',
    });
    setIngredients(recipe.ingredients.map(ing => ({
      quantity: ing.quantity,
      unit: ing.unit,
      name: ing.name,
      category: ing.category,
    })));
    setMacros(recipe.macros || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || ingredients.some(ing => !ing.name.trim())) return;

    const recipeData = {
      name: formData.name.trim(),
      servings: parseInt(formData.servings) || 4,
      prepTime: formData.prepTime.trim() || undefined,
      instructions: formData.instructions.trim() || undefined,
      ingredients: ingredients
        .filter(ing => ing.name.trim())
        .map(ing => ({
          ...ing,
          quantity: typeof ing.quantity === 'string' ? parseFloat(ing.quantity) || 0 : ing.quantity,
          id: Date.now().toString() + Math.random().toString(),
        })),
      macros,
      isFavorite: editingRecipe?.isFavorite || false,
    };

    if (editingRecipe) {
      updateRecipe(editingRecipe.id, recipeData);
      setModalVisible(false);
    } else {
      const success = addRecipe(recipeData, isPro);
      if (success) {
        setModalVisible(false);
      } else {
        Alert.alert(
          'Upgrade to Pro',
          'Free tier is limited to 5 recipes. Upgrade to unlock unlimited recipes!',
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
    deleteRecipe(id);
  };

  const toggleFavorite = (recipe: Recipe) => {
    updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite });
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { quantity: 1, unit: 'item', name: '', category: 'pantry' }]);
  };

  const fetchIngredientSuggestions = async (query: string) => {
    if (query.length < 2) {
      setIngredientSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.spoonacular.com/food/ingredients/autocomplete?query=${encodeURIComponent(query)}&number=8&apiKey=${SPOONACULAR_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      
      const data = await response.json();
      const suggestions = data.map((item: { name: string }) => item.name);
      setIngredientSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to fetch ingredient suggestions:', error);
      setIngredientSuggestions([]);
    }
  };

  const searchApiRecipes = async () => {
    if (!apiSearchQuery.trim()) return;
    
    if (!isPro) {
      Alert.alert(
        'Upgrade to Pro',
        'Recipe API search is a premium feature. Upgrade to unlock advanced recipe search!',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/paywall') }
        ]
      );
      return;
    }

    setApiLoading(true);
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(apiSearchQuery)}&number=12&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      
      const data = await response.json();
      setApiSearchResults(data.results || []);
    } catch (error) {
      console.error('Failed to search recipes:', error);
      Alert.alert('Error', 'Failed to search recipes. Please try again.');
    } finally {
      setApiLoading(false);
    }
  };

  const importApiRecipe = async (apiRecipe: any) => {
    try {
      const ingredients = apiRecipe.extendedIngredients?.map((ing: any) => ({
        quantity: ing.amount || 1,
        unit: ing.unit || 'item',
        name: ing.name || ing.original,
        category: 'pantry' as Category,
        id: Date.now().toString() + Math.random().toString(),
      })) || [];

      const macros = {
        calories: apiRecipe.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0,
        protein: apiRecipe.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0,
        carbs: apiRecipe.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0,
        fat: apiRecipe.nutrition?.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0,
        fiber: apiRecipe.nutrition?.nutrients?.find((n: any) => n.name === 'Fiber')?.amount || 0,
      };

      const recipeData = {
        name: apiRecipe.title,
        servings: apiRecipe.servings || 4,
        prepTime: apiRecipe.readyInMinutes ? `${apiRecipe.readyInMinutes} mins` : undefined,
        instructions: apiRecipe.instructions || apiRecipe.summary || undefined,
        ingredients,
        macros,
        imageUrl: apiRecipe.image,
        sourceUrl: apiRecipe.sourceUrl,
        isFromApi: true,
        isFavorite: false,
      };

      const success = addRecipe(recipeData, isPro);
      if (success) {
        Alert.alert('Success', 'Recipe imported successfully!');
        setShowApiSearch(false);
        setApiSearchQuery('');
        setApiSearchResults([]);
      } else {
        Alert.alert(
          'Upgrade to Pro',
          'Free tier is limited to 5 recipes. Upgrade to unlock unlimited recipes!',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/paywall') }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to import recipe:', error);
      Alert.alert('Error', 'Failed to import recipe. Please try again.');
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  const updateIngredient = (index: number, updates: Partial<Omit<Ingredient, 'id'> & { quantity: number | string }>) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], ...updates };
    setIngredients(updated);

    if (updates.name !== undefined) {
      setActiveIngredientIndex(index);
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        fetchIngredientSuggestions(updates.name as string);
      }, 300);
      setSearchTimeout(timeout);
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (filterCategory === 'favorites') {
        return matchesSearch && recipe.isFavorite;
      }
      
      const matchesCategory = filterCategory === 'all' || 
        recipe.ingredients.some(ing => ing.category === filterCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchQuery, filterCategory]);

  const favoritesCount = recipes.filter(r => r.isFavorite).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Recipes', 
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/customer-center')} 
              style={styles.headerButton}
            >
              <Settings size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />

      {!revenueCatLoading && !isPro && recipes.filter(r => !r.isSampleRecipe).length > 0 && (
        <View style={[styles.bannerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.banner}>
            <Crown size={20} color="#10b981" />
            <Text style={[styles.bannerText, { color: colors.text }]}>
              {recipes.filter(r => !r.isSampleRecipe).length}/5 recipes used (sample recipes excluded)
            </Text>
            <TouchableOpacity 
              style={styles.bannerButton}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.bannerButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBackground }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search recipes or ingredients..."
            placeholderTextColor={colors.placeholderText}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: colors.inputBackground }, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={20} color={showFilters ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.apiSearchButton}
          onPress={() => setShowApiSearch(true)}
        >
          <Globe size={20} color="#10b981" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text style={[styles.filterChipText, { color: colors.textSecondary }, filterCategory === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'favorites' && styles.filterChipActive]}
            onPress={() => setFilterCategory('favorites')}
          >
            <Star size={14} color={filterCategory === 'favorites' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.filterChipText, { color: colors.textSecondary }, filterCategory === 'favorites' && styles.filterChipTextActive]}>
              Favorites ({favoritesCount})
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
        {filteredRecipes.length === 0 && recipes.length === 0 && (
          <View style={styles.emptyState}>
            <ChefHat size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No recipes yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add recipes with ingredients</Text>
          </View>
        )}

        {filteredRecipes.length === 0 && recipes.length > 0 && (
          <View style={styles.emptyState}>
            <Search size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No recipes found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Try adjusting your search or filters</Text>
          </View>
        )}

        {filteredRecipes.map(recipe => (
          <TouchableOpacity
            key={recipe.id}
            style={[styles.recipeCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => openEditModal(recipe)}
            activeOpacity={0.7}
          >
            <View style={styles.recipeHeader}>
              <View style={styles.recipeHeaderLeft}>
                <Text style={[styles.recipeName, { color: colors.text }]}>{recipe.name}</Text>
                {recipe.isSampleRecipe && (
                  <View style={styles.sampleBadge}>
                    <Text style={styles.sampleBadgeText}>Sample</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => toggleFavorite(recipe)}
                  style={styles.favoriteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Star 
                    size={18} 
                    color={recipe.isFavorite ? colors.warning : colors.textTertiary} 
                    fill={recipe.isFavorite ? '#f59e0b' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (recipe.isSampleRecipe) {
                    Alert.alert(
                      'Sample Recipe',
                      'This is a sample recipe. Are you sure you want to delete it?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', onPress: () => handleDelete(recipe.id), style: 'destructive' }
                      ]
                    );
                  } else {
                    handleDelete(recipe.id);
                  }
                }}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.recipeInfo}>
              <Text style={[styles.recipeDetail, { color: colors.textSecondary }]}>
                {recipe.servings} servings
              </Text>
              {recipe.prepTime && (
                <Text style={[styles.recipeDetail, { color: colors.textSecondary }]}> • {recipe.prepTime}</Text>
              )}
            </View>

            {recipe.macros && ((recipe.macros.calories || 0) > 0) && (
              <View style={styles.macrosRow}>
                {(recipe.macros.calories || 0) > 0 && (
                  <View style={[styles.macroChip, { backgroundColor: colors.inputBackground }]}>
                    <Text style={[styles.macroValue, { color: colors.text }]}>{Math.round(recipe.macros.calories || 0)}</Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>cal</Text>
                  </View>
                )}
                {(recipe.macros.protein || 0) > 0 && (
                  <View style={[styles.macroChip, { backgroundColor: colors.inputBackground }]}>
                    <Text style={[styles.macroValue, { color: colors.text }]}>{Math.round(recipe.macros.protein || 0)}g</Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>protein</Text>
                  </View>
                )}
                {(recipe.macros.carbs || 0) > 0 && (
                  <View style={[styles.macroChip, { backgroundColor: colors.inputBackground }]}>
                    <Text style={[styles.macroValue, { color: colors.text }]}>{Math.round(recipe.macros.carbs || 0)}g</Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>carbs</Text>
                  </View>
                )}
                {(recipe.macros.fat || 0) > 0 && (
                  <View style={[styles.macroChip, { backgroundColor: colors.inputBackground }]}>
                    <Text style={[styles.macroValue, { color: colors.text }]}>{Math.round(recipe.macros.fat || 0)}g</Text>
                    <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>fat</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={[styles.ingredientsTitle, { color: colors.text }]}>
              {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
            </Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.slice(0, 3).map(ing => (
                <Text key={ing.id} style={[styles.ingredientText, { color: colors.textSecondary }]}>
                  • {ing.quantity} {ing.unit} {ing.name}
                </Text>
              ))}
              {recipe.ingredients.length > 3 && (
                <Text style={[styles.moreText, { color: colors.primary }]}>+{recipe.ingredients.length - 3} more</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.8}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showApiSearch}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowApiSearch(false)}
      >
        <View style={[styles.apiModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.apiModalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.apiModalTitle, { color: colors.text }]}>Search Recipes</Text>
            <TouchableOpacity onPress={() => setShowApiSearch(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.apiSearchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.apiSearchInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
              value={apiSearchQuery}
              onChangeText={setApiSearchQuery}
              placeholder="Search for recipes..."
              placeholderTextColor={colors.placeholderText}
              onSubmitEditing={searchApiRecipes}
            />
            <TouchableOpacity 
              style={styles.apiSearchButton}
              onPress={searchApiRecipes}
              disabled={apiLoading}
            >
              {apiLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Search size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.apiResults} contentContainerStyle={styles.apiResultsContainer}>
            {apiSearchResults.map(recipe => (
              <TouchableOpacity
                key={recipe.id}
                style={[styles.apiRecipeCard, { backgroundColor: colors.cardBackground }]}
                onPress={() => importApiRecipe(recipe)}
                activeOpacity={0.7}
              >
                <Text style={[styles.apiRecipeName, { color: colors.text }]}>{recipe.title}</Text>
                <Text style={[styles.apiRecipeInfo, { color: colors.textSecondary }]}>
                  {recipe.servings} servings • {recipe.readyInMinutes} mins
                </Text>
                <TouchableOpacity 
                  style={styles.importButton}
                  onPress={() => importApiRecipe(recipe)}
                >
                  <Text style={styles.importButtonText}>Import</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {apiSearchResults.length === 0 && !apiLoading && apiSearchQuery && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No recipes found. Try a different search.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingRecipe ? 'Edit Recipe' : 'Add Recipe'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Recipe Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Grilled Chicken Pasta"
                  placeholderTextColor={colors.placeholderText}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: colors.text }]}>Servings *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                    value={formData.servings}
                    onChangeText={(text) => setFormData({ ...formData, servings: text })}
                    keyboardType="numeric"
                    placeholder="4"
                    placeholderTextColor={colors.placeholderText}
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.label, { color: colors.text }]}>Prep Time</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                    value={formData.prepTime}
                    onChangeText={(text) => setFormData({ ...formData, prepTime: text })}
                    placeholder="30 mins"
                    placeholderTextColor={colors.placeholderText}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Macros (per serving)</Text>
                <View style={styles.macrosGrid}>
                  <View style={styles.macroInput}>
                    <Text style={[styles.macroInputLabel, { color: colors.textSecondary }]}>Calories</Text>
                    <TextInput
                      style={[styles.macroInputField, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={macros.calories?.toString() || ''}
                      onChangeText={(text) => setMacros({ ...macros, calories: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.placeholderText}
                    />
                  </View>
                  <View style={styles.macroInput}>
                    <Text style={[styles.macroInputLabel, { color: colors.textSecondary }]}>Protein (g)</Text>
                    <TextInput
                      style={[styles.macroInputField, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={macros.protein?.toString() || ''}
                      onChangeText={(text) => setMacros({ ...macros, protein: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.placeholderText}
                    />
                  </View>
                  <View style={styles.macroInput}>
                    <Text style={[styles.macroInputLabel, { color: colors.textSecondary }]}>Carbs (g)</Text>
                    <TextInput
                      style={[styles.macroInputField, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={macros.carbs?.toString() || ''}
                      onChangeText={(text) => setMacros({ ...macros, carbs: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.placeholderText}
                    />
                  </View>
                  <View style={styles.macroInput}>
                    <Text style={[styles.macroInputLabel, { color: colors.textSecondary }]}>Fat (g)</Text>
                    <TextInput
                      style={[styles.macroInputField, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={macros.fat?.toString() || ''}
                      onChangeText={(text) => setMacros({ ...macros, fat: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.placeholderText}
                    />
                  </View>
                  <View style={styles.macroInput}>
                    <Text style={[styles.macroInputLabel, { color: colors.textSecondary }]}>Fiber (g)</Text>
                    <TextInput
                      style={[styles.macroInputField, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={macros.fiber?.toString() || ''}
                      onChangeText={(text) => setMacros({ ...macros, fiber: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.placeholderText}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.label, { color: colors.text }]}>Ingredients *</Text>
                  <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
                    <Plus size={18} color="#10b981" />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientRow}>
                    <View style={styles.ingredientInputs}>
                      <TextInput
                        style={[styles.input, styles.quantityInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                        value={ingredient.quantity === 0 ? '' : ingredient.quantity.toString()}
                        onChangeText={(text) => {
                          if (text === '' || text === '0') {
                            updateIngredient(index, { quantity: 0 });
                          } else {
                            const parsed = parseFloat(text);
                            if (!isNaN(parsed) && parsed >= 0) {
                              updateIngredient(index, { quantity: parsed });
                            } else if (text === '.' || text.match(/^\d*\.?\d*$/)) {
                              updateIngredient(index, { quantity: text as any });
                            }
                          }
                        }}
                        keyboardType="decimal-pad"
                        placeholder="1"
                        placeholderTextColor={colors.placeholderText}
                      />

                      <View style={styles.unitSelect}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {UNITS.map(unit => (
                            <TouchableOpacity
                              key={unit}
                              style={[
                                styles.unitButton,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                                ingredient.unit === unit && styles.unitButtonActive,
                              ]}
                              onPress={() => updateIngredient(index, { unit })}
                            >
                              <Text
                                style={[
                                  styles.unitButtonText,
                                  { color: colors.textSecondary },
                                  ingredient.unit === unit && styles.unitButtonTextActive,
                                ]}
                              >
                                {unit}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      <View style={styles.ingredientNameContainer}>
                        <TextInput
                          style={[styles.input, styles.nameInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                          value={ingredient.name}
                          onChangeText={(text) => updateIngredient(index, { name: text })}
                          onFocus={() => {
                            setActiveIngredientIndex(index);
                            if (ingredient.name.length >= 2) {
                              fetchIngredientSuggestions(ingredient.name);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setActiveIngredientIndex(null);
                              setIngredientSuggestions([]);
                            }, 200);
                          }}
                          placeholder="chicken breast"
                          placeholderTextColor={colors.placeholderText}
                        />
                        {activeIngredientIndex === index && ingredientSuggestions.length > 0 && (
                          <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            {ingredientSuggestions.map((suggestion, suggestionIndex) => (
                              <TouchableOpacity
                                key={suggestionIndex}
                                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                                onPress={() => {
                                  updateIngredient(index, { name: suggestion });
                                  setIngredientSuggestions([]);
                                  setActiveIngredientIndex(null);
                                }}
                              >
                                <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.categoryRow}>
                      {CATEGORIES.map(cat => (
                        <TouchableOpacity
                          key={cat.key}
                          style={[
                            styles.categoryChip,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            ingredient.category === cat.key && {
                              backgroundColor: cat.color + '20',
                              borderColor: cat.color,
                            },
                          ]}
                          onPress={() => updateIngredient(index, { category: cat.key })}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              { color: colors.textSecondary },
                              ingredient.category === cat.key && { color: cat.color },
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {ingredients.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeIngredient(index)}
                        style={styles.removeButton}
                      >
                        <Trash2 size={16} color="#ef4444" />
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}

                    {index < ingredients.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  </View>
                ))}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Instructions (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={formData.instructions}
                  onChangeText={(text) => setFormData({ ...formData, instructions: text })}
                  placeholder="Add cooking instructions..."
                  placeholderTextColor={colors.placeholderText}
                  multiline
                  numberOfLines={6}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { backgroundColor: colors.inputBackground }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonSecondaryText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSave}
              >
                <Text style={styles.buttonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
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
    textAlign: 'center',
  },
  recipeCard: {
    backgroundColor: '#fff',
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
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  recipeInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recipeDetail: {
    fontSize: 14,
    color: '#64748b',
  },
  macrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  macroChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  macroLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  ingredientsList: {
    gap: 4,
  },
  ingredientText: {
    fontSize: 13,
    color: '#64748b',
  },
  moreText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500' as const,
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
      },
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
    maxHeight: '95%',
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
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroInput: {
    flex: 1,
    minWidth: 100,
  },
  macroInputLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#64748b',
    marginBottom: 6,
  },
  macroInputField: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  ingredientRow: {
    marginBottom: 16,
  },
  ingredientInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quantityInput: {
    width: 70,
  },
  unitSelect: {
    width: 100,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 4,
    backgroundColor: '#fff',
  },
  unitButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  unitButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  nameInput: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500' as const,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 16,
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
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  bannerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#10b98110',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    gap: 10,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  bannerButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bannerButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
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
  apiSearchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10b98110',
    alignItems: 'center',
    justifyContent: 'center',
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
  ingredientNameContainer: {
    flex: 1,
    position: 'relative',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      },
    }),
    zIndex: 1000,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  suggestionText: {
    fontSize: 15,
    color: '#0f172a',
  },
  apiModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  apiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  apiModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  apiSearchBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  apiSearchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  apiResults: {
    flex: 1,
  },
  apiResultsContainer: {
    padding: 16,
  },
  apiRecipeCard: {
    backgroundColor: '#fff',
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
  apiRecipeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 6,
  },
  apiRecipeInfo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  sampleBadge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  sampleBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

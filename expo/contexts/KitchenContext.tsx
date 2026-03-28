import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadDefaultContent } from '../utils/defaultContent';

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'other';
  expirationDate?: string;
  isPantryStaple?: boolean;
  isRunningLow?: boolean;
  lowStockThreshold?: number;
  notes?: string;
};

export type Ingredient = {
  id: string;
  quantity: number;
  unit: string;
  name: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'other';
};

export type MacroNutrients = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};

export type RecipePhoto = {
  id: string;
  uri: string;
  isFeatured: boolean;
  caption?: string;
};

export type RecipeNote = {
  id: string;
  date: string;
  text: string;
};

export type Recipe = {
  id: string;
  name: string;
  servings: number;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  ingredients: Ingredient[];
  instructions?: string;
  isFavorite?: boolean;
  macros?: MacroNutrients;
  imageUrl?: string;
  sourceUrl?: string;
  isFromApi?: boolean;
  photos?: RecipePhoto[];
  rating?: number;
  notes?: RecipeNote[];
  dateLastMade?: string;
  timesMade?: number;
  tags?: string[];
  reheatInstructions?: string;
  isSampleRecipe?: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
};

export type MealPlan = {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  recipeId?: string;
  notes?: string;
};

export type FreezerMeal = {
  id: string;
  name: string;
  prepDate: string;
  servings: number;
  notes?: string;
  recipeId?: string;
  useByDate?: string;
  reheatInstructions?: string;
  photoUri?: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'beverages' | 'other';
  checked: boolean;
  generatedFromMeal?: boolean;
  notes?: string;
  price?: number;
  storeSection?: string;
};

export type ShoppingListConfig = {
  startDate?: string;
  endDate?: string;
  autoUpdate: boolean;
};

export type Leftover = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  dateStored: string;
  useByDate: string;
  storageLocation: 'fridge' | 'freezer';
  recipeId?: string;
  photoUri?: string;
};

export type NotificationSettings = {
  weeklyMealPrepReminder: boolean;
  weeklyMealPrepDay: number;
  weeklyMealPrepTime: string;
  freezerMealExpiration: boolean;
  lowPantryStaples: boolean;
  mealReminders: boolean;
  shoppingListReminder: boolean;
};

const STORAGE_KEYS = {
  INVENTORY: '@kitchen_inventory',
  MEALS: '@kitchen_meals',
  FREEZER: '@kitchen_freezer',
  SHOPPING: '@kitchen_shopping',
  RECIPES: '@kitchen_recipes',
  SHOPPING_CONFIG: '@kitchen_shopping_config',
  LEFTOVERS: '@kitchen_leftovers',
  NOTIFICATION_SETTINGS: '@notification_settings',
  ONBOARDING_COMPLETED: '@onboarding_completed',
  DEFAULTS_LOADED: '@defaults_loaded',
};

export const [KitchenProvider, useKitchen] = createContextHook(() => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [freezerMeals, setFreezerMeals] = useState<FreezerMeal[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [shoppingConfig, setShoppingConfig] = useState<ShoppingListConfig>({
    autoUpdate: false,
  });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    weeklyMealPrepReminder: true,
    weeklyMealPrepDay: 0,
    weeklyMealPrepTime: '18:00',
    freezerMealExpiration: true,
    lowPantryStaples: true,
    mealReminders: false,
    shoppingListReminder: false,
  });
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const cleanupPastMeals = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      setMeals(current => {
        const filtered = current.filter(meal => meal.date >= todayStr);
        if (filtered.length !== current.length) {
          console.log('[Kitchen] Cleared past meal plans');
          AsyncStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(filtered)).catch(console.error);
        }
        return filtered;
      });
    };

    const interval = setInterval(cleanupPastMeals, 60000);
    cleanupPastMeals();

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [
        inventoryData,
        mealsData,
        freezerData,
        shoppingData,
        recipesData,
        configData,
        leftoversData,
        notificationData,
        onboardingData,
        defaultsLoadedData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
        AsyncStorage.getItem(STORAGE_KEYS.MEALS),
        AsyncStorage.getItem(STORAGE_KEYS.FREEZER),
        AsyncStorage.getItem(STORAGE_KEYS.SHOPPING),
        AsyncStorage.getItem(STORAGE_KEYS.RECIPES),
        AsyncStorage.getItem(STORAGE_KEYS.SHOPPING_CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.LEFTOVERS),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        AsyncStorage.getItem(STORAGE_KEYS.DEFAULTS_LOADED),
      ]);

      let loadedInventory = inventoryData ? JSON.parse(inventoryData) : [];
      let loadedRecipes = recipesData ? JSON.parse(recipesData) : [];
      let loadedFreezerMeals = freezerData ? JSON.parse(freezerData) : [];
      
      const defaultsLoaded = defaultsLoadedData ? JSON.parse(defaultsLoadedData) : false;

      // Load default content on first launch
      if (!defaultsLoaded) {
        console.log('[Kitchen] Loading default content for first launch');
        const defaults = await loadDefaultContent();
        loadedInventory = [...loadedInventory, ...defaults.inventory];
        loadedRecipes = [...loadedRecipes, ...defaults.recipes];
        loadedFreezerMeals = [...loadedFreezerMeals, ...defaults.freezerMeals];
        
        // Save all defaults and mark as loaded
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(loadedInventory)),
          AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(loadedRecipes)),
          AsyncStorage.setItem(STORAGE_KEYS.FREEZER, JSON.stringify(loadedFreezerMeals)),
          AsyncStorage.setItem(STORAGE_KEYS.DEFAULTS_LOADED, JSON.stringify(true)),
        ]);

      }

      setInventory(loadedInventory);
      setRecipes(loadedRecipes);
      setFreezerMeals(loadedFreezerMeals);
      
      if (mealsData) setMeals(JSON.parse(mealsData));
      if (shoppingData) setShoppingList(JSON.parse(shoppingData));
      if (configData) setShoppingConfig(JSON.parse(configData));
      if (leftoversData) setLeftovers(JSON.parse(leftoversData));
      if (notificationData) setNotificationSettings(JSON.parse(notificationData));
      if (onboardingData) setOnboardingCompleted(JSON.parse(onboardingData));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(true)).catch(console.error);
  }, []);

  const updateNotificationSettings = useCallback((settings: Partial<NotificationSettings>) => {
    setNotificationSettings(current => {
      const updated = { ...current, ...settings };
      AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setInventory(current => {
      const updated = [...current, newItem];
      AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory(current => {
      const updated = current.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventory(current => {
      const updated = current.filter(item => item.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const deleteMultipleInventoryItems = useCallback((ids: string[]) => {
    setInventory(current => {
      const updated = current.filter(item => !ids.includes(item.id));
      AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const addMealPlan = useCallback((meal: Omit<MealPlan, 'id'>, isPro: boolean): boolean => {
    if (!isPro) {
      const mealDate = new Date(meal.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((mealDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 14) {
        console.log('[Kitchen] Free tier limit: Cannot plan more than 14 days ahead');
        return false;
      }
    }
    const newMeal = { ...meal, id: Date.now().toString() };
    setMeals(current => {
      const updated = [...current, newMeal];
      AsyncStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
    return true;
  }, []);

  const updateMealPlan = useCallback((id: string, updates: Partial<MealPlan>, isPro: boolean): boolean => {
    if (!isPro && updates.date) {
      const mealDate = new Date(updates.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((mealDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 14) {
        console.log('[Kitchen] Free tier limit: Cannot plan more than 14 days ahead');
        return false;
      }
    }
    setMeals(current => {
      const updated = current.map(meal => 
        meal.id === id ? { ...meal, ...updates } : meal
      );
      AsyncStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
    return true;
  }, []);

  const deleteMealPlan = useCallback((id: string) => {
    setMeals(current => {
      const updated = current.filter(meal => meal.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const addFreezerMeal = useCallback((meal: Omit<FreezerMeal, 'id'>) => {
    const newMeal = { ...meal, id: Date.now().toString() };
    setFreezerMeals(current => {
      const updated = [...current, newMeal];
      AsyncStorage.setItem(STORAGE_KEYS.FREEZER, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const updateFreezerMeal = useCallback((id: string, updates: Partial<FreezerMeal>) => {
    setFreezerMeals(current => {
      const updated = current.map(meal => 
        meal.id === id ? { ...meal, ...updates } : meal
      );
      AsyncStorage.setItem(STORAGE_KEYS.FREEZER, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const deleteFreezerMeal = useCallback((id: string) => {
    setFreezerMeals(current => {
      const updated = current.filter(meal => meal.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.FREEZER, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const addShoppingItem = useCallback((item: Omit<ShoppingItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString(), generatedFromMeal: false };
    setShoppingList(current => {
      const updated = [...current, newItem];
      AsyncStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingList(current => {
      const updated = current.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      AsyncStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const deleteShoppingItem = useCallback((id: string) => {
    setShoppingList(current => {
      const updated = current.filter(item => item.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const clearCheckedShoppingItems = useCallback(() => {
    setShoppingList(current => {
      const updated = current.filter(item => !item.checked);
      AsyncStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const addLeftover = useCallback((leftover: Omit<Leftover, 'id'>) => {
    const newLeftover = { ...leftover, id: Date.now().toString() };
    setLeftovers(current => {
      const updated = [...current, newLeftover];
      AsyncStorage.setItem(STORAGE_KEYS.LEFTOVERS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const updateLeftover = useCallback((id: string, updates: Partial<Leftover>) => {
    setLeftovers(current => {
      const updated = current.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      AsyncStorage.setItem(STORAGE_KEYS.LEFTOVERS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const deleteLeftover = useCallback((id: string) => {
    setLeftovers(current => {
      const updated = current.filter(item => item.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.LEFTOVERS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const checkInventoryForItem = useCallback((itemName: string): InventoryItem | undefined => {
    return inventory.find(item => 
      item.name.toLowerCase().includes(itemName.toLowerCase()) ||
      itemName.toLowerCase().includes(item.name.toLowerCase())
    );
  }, [inventory]);

  const checkInventoryForRecipe = useCallback((recipeId: string): {
    missingItems: Ingredient[];
    lowStockItems: Ingredient[];
    availableItems: Ingredient[];
  } => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
      return { missingItems: [], lowStockItems: [], availableItems: [] };
    }

    const missingItems: Ingredient[] = [];
    const lowStockItems: Ingredient[] = [];
    const availableItems: Ingredient[] = [];

    recipe.ingredients.forEach(ingredient => {
      const inventoryItem = checkInventoryForItem(ingredient.name);
      
      if (!inventoryItem) {
        missingItems.push(ingredient);
      } else {
        const hasEnough = inventoryItem.quantity >= ingredient.quantity;
        const isLowStock = inventoryItem.quantity < ingredient.quantity * 1.5;
        
        if (!hasEnough) {
          missingItems.push(ingredient);
        } else if (isLowStock) {
          lowStockItems.push(ingredient);
        } else {
          availableItems.push(ingredient);
        }
      }
    });

    return { missingItems, lowStockItems, availableItems };
  }, [inventory, recipes, checkInventoryForItem]);

  const addRecipe = useCallback((recipe: Omit<Recipe, 'id'>, isPro: boolean): boolean => {
    const nonSampleRecipes = recipes.filter(r => !r.isSampleRecipe);
    if (!isPro && nonSampleRecipes.length >= 5) {
      console.log('[Kitchen] Free tier limit: Cannot add more than 5 recipes (sample recipes excluded)');
      return false;
    }
    const newRecipe = { ...recipe, id: Date.now().toString(), timesMade: 0 };
    setRecipes(current => {
      const updated = [...current, newRecipe];
      AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
    return true;
  }, [recipes]);

  const updateRecipe = useCallback((id: string, updates: Partial<Recipe>) => {
    setRecipes(current => {
      const updated = current.map(recipe => 
        recipe.id === id ? { ...recipe, ...updates } : recipe
      );
      AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setRecipes(current => {
      const updated = current.filter(recipe => recipe.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const deleteMultipleRecipes = useCallback((ids: string[]) => {
    setRecipes(current => {
      const updated = current.filter(recipe => !ids.includes(recipe.id));
      AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const markRecipeAsMade = useCallback((id: string) => {
    setRecipes(current => {
      const updated = current.map(recipe => 
        recipe.id === id 
          ? { 
              ...recipe, 
              dateLastMade: new Date().toISOString(),
              timesMade: (recipe.timesMade || 0) + 1 
            } 
          : recipe
      );
      AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const addRecipeNote = useCallback((recipeId: string, noteText: string) => {
    const note: RecipeNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      text: noteText,
    };
    
    setRecipes(current => {
      const updated = current.map(recipe => 
        recipe.id === recipeId 
          ? { ...recipe, notes: [...(recipe.notes || []), note] } 
          : recipe
      );
      AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const checkFreezerForMeal = useCallback((mealName: string): number => {
    const mealKey = mealName.toLowerCase().trim();
    return freezerMeals.filter(fm => fm.name.toLowerCase().trim() === mealKey).length;
  }, [freezerMeals]);

  const regenerateShoppingList = useCallback(() => {
    if (!shoppingConfig.autoUpdate || !shoppingConfig.startDate || !shoppingConfig.endDate) {
      return;
    }

    setShoppingList(current => {
      const manualItems = current.filter(item => !item.generatedFromMeal);
      const ingredientMap = new Map<string, { quantity: number; unit: string; category: ShoppingItem['category']; name: string }>();

      const start = new Date(shoppingConfig.startDate!);
      const end = new Date(shoppingConfig.endDate!);
      const freezerUsageMap = new Map<string, number>();

      const sortedMeals = [...meals]
        .filter(meal => {
          const mealDate = new Date(meal.date);
          return mealDate >= start && mealDate <= end;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedMeals.forEach(meal => {
        const mealKey = meal.name.toLowerCase().trim();
        const totalFreezerCount = checkFreezerForMeal(meal.name);
        const usedCount = freezerUsageMap.get(mealKey) || 0;
        
        if (usedCount < totalFreezerCount) {
          freezerUsageMap.set(mealKey, usedCount + 1);
          return;
        }

        if (meal.recipeId) {
          const recipe = recipes.find(r => r.id === meal.recipeId);
          if (recipe) {
            recipe.ingredients.forEach(ingredient => {
              const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;
              const existing = ingredientMap.get(key);
              
              if (existing) {
                existing.quantity += ingredient.quantity;
              } else {
                ingredientMap.set(key, {
                  name: ingredient.name,
                  quantity: ingredient.quantity,
                  unit: ingredient.unit,
                  category: ingredient.category,
                });
              }
            });
          }
        }
      });

      const generatedItems = Array.from(ingredientMap.values()).map(item => ({
        ...item,
        id: Date.now().toString() + Math.random().toString(),
        checked: false,
        generatedFromMeal: true as const,
      }));

      const updated = [...manualItems, ...generatedItems];
      AsyncStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, [meals, recipes, shoppingConfig, checkFreezerForMeal]);

  useEffect(() => {
    if (!isLoading && shoppingConfig.autoUpdate && shoppingConfig.startDate && shoppingConfig.endDate) {
      regenerateShoppingList();
    }
  }, [meals, freezerMeals, recipes, shoppingConfig.autoUpdate, shoppingConfig.startDate, shoppingConfig.endDate, isLoading, regenerateShoppingList]);

  const generateShoppingListFromMealPlan = useCallback((startDate?: string, endDate?: string) => {
    const manualItems = shoppingList.filter(item => !item.generatedFromMeal);
    const ingredientMap = new Map<string, { quantity: number; unit: string; category: typeof shoppingList[0]['category']; name: string }>();
    const mealsFromFreezer: string[] = [];

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const freezerUsageMap = new Map<string, number>();

    const sortedMeals = [...meals]
      .filter(meal => {
        if (startDate && endDate) {
          const mealDate = new Date(meal.date);
          if (start && end && (mealDate < start || mealDate > end)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedMeals.forEach(meal => {
      const mealKey = meal.name.toLowerCase().trim();
      const totalFreezerCount = checkFreezerForMeal(meal.name);
      const usedCount = freezerUsageMap.get(mealKey) || 0;
      
      if (usedCount < totalFreezerCount) {
        console.log(`[Kitchen] Meal "${meal.name}" on ${meal.date} using freezer meal ${usedCount + 1}/${totalFreezerCount}`);
        freezerUsageMap.set(mealKey, usedCount + 1);
        mealsFromFreezer.push(meal.name);
        return;
      }

      if (meal.recipeId) {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (recipe) {
          console.log(`[Kitchen] Meal "${meal.name}" on ${meal.date} needs ingredients (no freezer meal available)`);
          recipe.ingredients.forEach(ingredient => {
            const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;
            const existing = ingredientMap.get(key);
            
            if (existing) {
              existing.quantity += ingredient.quantity;
            } else {
              ingredientMap.set(key, {
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                category: ingredient.category,
              });
            }
          });
        }
      }
    });

    const newItems = Array.from(ingredientMap.values()).map(item => ({
      ...item,
      id: Date.now().toString() + Math.random().toString(),
      checked: false,
      generatedFromMeal: true as const,
    }));

    const updated = [...manualItems, ...newItems];
    setShoppingList(updated);
    
    const config: ShoppingListConfig = {
      startDate,
      endDate,
      autoUpdate: !!(startDate && endDate),
    };
    setShoppingConfig(config);

    Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(updated)),
      AsyncStorage.setItem(STORAGE_KEYS.SHOPPING_CONFIG, JSON.stringify(config)),
    ]).catch(console.error);

    if (mealsFromFreezer.length > 0) {
      console.log(`[Kitchen] ${mealsFromFreezer.length} meal(s) pulled from freezer:`, mealsFromFreezer);
    }
  }, [meals, recipes, shoppingList, checkFreezerForMeal]);

  return useMemo(() => ({
    inventory,
    meals,
    freezerMeals,
    shoppingList,
    recipes,
    leftovers,
    isLoading,
    shoppingConfig,
    notificationSettings,
    onboardingCompleted,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    deleteMultipleInventoryItems,
    addMealPlan,
    updateMealPlan,
    deleteMealPlan,
    addFreezerMeal,
    updateFreezerMeal,
    deleteFreezerMeal,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCheckedShoppingItems,
    checkInventoryForItem,
    checkInventoryForRecipe,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    deleteMultipleRecipes,
    markRecipeAsMade,
    addRecipeNote,
    generateShoppingListFromMealPlan,
    addLeftover,
    updateLeftover,
    deleteLeftover,
    updateNotificationSettings,
    completeOnboarding,
  }), [
    inventory,
    meals,
    freezerMeals,
    shoppingList,
    recipes,
    leftovers,
    isLoading,
    shoppingConfig,
    notificationSettings,
    onboardingCompleted,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    deleteMultipleInventoryItems,
    addMealPlan,
    updateMealPlan,
    deleteMealPlan,
    addFreezerMeal,
    updateFreezerMeal,
    deleteFreezerMeal,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCheckedShoppingItems,
    checkInventoryForItem,
    checkInventoryForRecipe,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    deleteMultipleRecipes,
    markRecipeAsMade,
    addRecipeNote,
    generateShoppingListFromMealPlan,
    addLeftover,
    updateLeftover,
    deleteLeftover,
    updateNotificationSettings,
    completeOnboarding,
  ]);
});

export function useInventoryByCategory() {
  const { inventory } = useKitchen();
  
  return useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {
      produce: [],
      dairy: [],
      meat: [],
      pantry: [],
      other: [],
    };
    
    inventory.forEach(item => {
      grouped[item.category].push(item);
    });
    
    return grouped;
  }, [inventory]);
}

export function useMealsByDate(date: string) {
  const { meals } = useKitchen();
  
  return useMemo(() => {
    return meals.filter(meal => meal.date === date);
  }, [meals, date]);
}

export function useShoppingByCategory() {
  const { shoppingList } = useKitchen();
  
  return useMemo(() => {
    const grouped: Record<string, ShoppingItem[]> = {
      produce: [],
      dairy: [],
      meat: [],
      pantry: [],
      frozen: [],
      bakery: [],
      beverages: [],
      other: [],
    };
    
    shoppingList.forEach(item => {
      grouped[item.category].push(item);
    });
    
    return grouped;
  }, [shoppingList]);
}

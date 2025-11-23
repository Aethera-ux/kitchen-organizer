import { InventoryItem, Recipe, FreezerMeal } from '../contexts/KitchenContext';

function generateId(): string {
  return `default_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDatePlusDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export async function loadDefaultContent(): Promise<{
  inventory: InventoryItem[];
  recipes: Recipe[];
  freezerMeals: FreezerMeal[];
}> {
  console.log('[DefaultContent] Creating default inventory, recipes, and freezer meals');
  
  // Default Kitchen Inventory (all marked as pantry staples)
  const defaultInventory: InventoryItem[] = [
    {
      id: generateId(),
      name: 'Olive Oil',
      quantity: 1,
      unit: 'bottle',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Salt',
      quantity: 1,
      unit: 'container',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Black Pepper',
      quantity: 1,
      unit: 'container',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Garlic Powder',
      quantity: 1,
      unit: 'container',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Onion Powder',
      quantity: 1,
      unit: 'container',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'All-Purpose Flour',
      quantity: 5,
      unit: 'lbs',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Sugar',
      quantity: 1,
      unit: 'bag',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Butter',
      quantity: 1,
      unit: 'lb',
      category: 'dairy',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Eggs',
      quantity: 12,
      unit: 'count',
      category: 'dairy',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Milk',
      quantity: 1,
      unit: 'gallon',
      category: 'dairy',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Chicken Broth',
      quantity: 2,
      unit: 'cans',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Rice',
      quantity: 2,
      unit: 'lbs',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Pasta',
      quantity: 1,
      unit: 'box',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Canned Tomatoes',
      quantity: 2,
      unit: 'cans',
      category: 'pantry',
      isPantryStaple: true,
    },
    {
      id: generateId(),
      name: 'Soy Sauce',
      quantity: 1,
      unit: 'bottle',
      category: 'pantry',
      isPantryStaple: true,
    },
  ];

  // Default Sample Recipes (marked as sample recipes)
  const defaultRecipes: Recipe[] = [
    {
      id: generateId(),
      name: 'Simple Chicken Stir-Fry',
      servings: 4,
      prepTime: '15 min',
      cookTime: '15 min',
      totalTime: '30 min',
      tags: ['Dinner', 'Asian', 'Quick & Easy', 'Under 30 min', 'High-Protein', 'Meal Prep'],
      difficulty: 'Easy',
      isSampleRecipe: true,
      ingredients: [
        {
          id: generateId(),
          name: 'boneless chicken breast',
          quantity: 1,
          unit: 'lb',
          category: 'meat',
        },
        {
          id: generateId(),
          name: 'mixed vegetables',
          quantity: 2,
          unit: 'cups',
          category: 'produce',
        },
        {
          id: generateId(),
          name: 'soy sauce',
          quantity: 3,
          unit: 'tbsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'olive oil',
          quantity: 2,
          unit: 'tbsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'garlic powder',
          quantity: 1,
          unit: 'tsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'ginger powder',
          quantity: 1,
          unit: 'tsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'cooked rice',
          quantity: 2,
          unit: 'cups',
          category: 'pantry',
        },
      ],
      instructions: `1. Heat olive oil in large skillet over medium-high heat
2. Add sliced chicken and cook until no longer pink, about 6-7 minutes
3. Add mixed vegetables and stir-fry for 5 minutes
4. Add soy sauce, garlic powder, and ginger powder
5. Stir well and cook for 2 more minutes
6. Serve over cooked rice`,
      macros: {
        calories: 380,
        protein: 32,
        carbs: 35,
        fat: 12,
      },
      notes: [{
        id: generateId(),
        date: new Date().toISOString(),
        text: 'Great for meal prep! Make a big batch on Sunday for the week ahead.',
      }],
    },
    {
      id: generateId(),
      name: 'Easy Pasta Marinara',
      servings: 4,
      prepTime: '5 min',
      cookTime: '20 min',
      totalTime: '25 min',
      tags: ['Dinner', 'Italian', 'Vegetarian', 'Quick & Easy', 'Under 30 min', 'Budget-Friendly'],
      difficulty: 'Easy',
      isSampleRecipe: true,
      ingredients: [
        {
          id: generateId(),
          name: 'pasta',
          quantity: 1,
          unit: 'lb',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'crushed tomatoes',
          quantity: 2,
          unit: 'cans (14 oz)',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'garlic',
          quantity: 3,
          unit: 'cloves',
          category: 'produce',
        },
        {
          id: generateId(),
          name: 'olive oil',
          quantity: 2,
          unit: 'tbsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'dried basil',
          quantity: 1,
          unit: 'tsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'dried oregano',
          quantity: 1,
          unit: 'tsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'salt',
          quantity: 1,
          unit: 'tsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'pepper',
          quantity: 0.5,
          unit: 'tsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'parmesan cheese',
          quantity: 0.5,
          unit: 'cup',
          category: 'dairy',
        },
      ],
      instructions: `1. Cook pasta according to package directions, drain and set aside
2. In large saucepan, heat olive oil over medium heat
3. Add garlic and cook for 1 minute until fragrant
4. Add crushed tomatoes, basil, oregano, salt, and pepper
5. Simmer for 15 minutes, stirring occasionally
6. Toss pasta with sauce
7. Serve with parmesan cheese`,
      macros: {
        calories: 420,
        protein: 14,
        carbs: 72,
        fat: 9,
      },
      notes: [{
        id: generateId(),
        date: new Date().toISOString(),
        text: 'Add ground beef or Italian sausage for a heartier meal!',
      }],
    },
    {
      id: generateId(),
      name: 'Sheet Pan Roasted Chicken & Vegetables',
      servings: 4,
      prepTime: '10 min',
      cookTime: '35 min',
      totalTime: '45 min',
      tags: ['Dinner', 'American', 'One-Pan', 'Healthy', 'Meal Prep', 'Easy'],
      difficulty: 'Easy',
      isSampleRecipe: true,
      ingredients: [
        {
          id: generateId(),
          name: 'chicken thighs',
          quantity: 4,
          unit: 'pieces',
          category: 'meat',
        },
        {
          id: generateId(),
          name: 'baby potatoes',
          quantity: 2,
          unit: 'cups',
          category: 'produce',
        },
        {
          id: generateId(),
          name: 'broccoli florets',
          quantity: 2,
          unit: 'cups',
          category: 'produce',
        },
        {
          id: generateId(),
          name: 'bell pepper',
          quantity: 1,
          unit: 'whole',
          category: 'produce',
        },
        {
          id: generateId(),
          name: 'olive oil',
          quantity: 3,
          unit: 'tbsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'garlic powder',
          quantity: 2,
          unit: 'tsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'paprika',
          quantity: 1,
          unit: 'tsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'salt',
          quantity: 1,
          unit: 'tsp',
          category: 'pantry',
        },
        {
          id: generateId(),
          name: 'pepper',
          quantity: 0.5,
          unit: 'tsp',
          category: 'pantry',
        },
      ],
      instructions: `1. Preheat oven to 425°F (220°C)
2. On large sheet pan, arrange chicken thighs in center
3. Surround with potatoes, broccoli, and bell pepper
4. Drizzle everything with olive oil
5. Season with garlic powder, paprika, salt, and pepper
6. Roast for 35-40 minutes until chicken reaches 165°F internal temp
7. Let rest 5 minutes before serving`,
      macros: {
        calories: 450,
        protein: 28,
        carbs: 28,
        fat: 24,
      },
      notes: [{
        id: generateId(),
        date: new Date().toISOString(),
        text: 'Perfect one-pan dinner! Swap vegetables based on what you have on hand.',
      }],
    },
  ];

  // Default Freezer Meals (linked to sample recipes)
  const defaultFreezerMeals: FreezerMeal[] = [
    {
      id: generateId(),
      name: 'Chicken Stir-Fry (Batch #1)',
      recipeId: defaultRecipes[0].id,
      prepDate: getCurrentDateString(),
      useByDate: getDatePlusDays(90),
      servings: 4,
      notes: 'Storage: Freezer-safe container',
      reheatInstructions: `Microwave: Heat on high for 4-5 minutes, stirring halfway through
Stovetop: Heat in skillet over medium heat for 8-10 minutes, stirring occasionally
From Frozen: Add 2-3 minutes to reheating time`,
    },
    {
      id: generateId(),
      name: 'Pasta Marinara (Batch #1)',
      recipeId: defaultRecipes[1].id,
      prepDate: getDatePlusDays(-7),
      useByDate: getDatePlusDays(83),
      servings: 4,
      notes: 'Storage: Freezer-safe container',
      reheatInstructions: `Microwave: Heat on high for 5-6 minutes, stirring halfway through
Stovetop: Heat in saucepan over medium-low heat for 10-12 minutes, stirring frequently
Oven: Bake at 350°F for 20-25 minutes covered`,
    },
    {
      id: generateId(),
      name: 'Sheet Pan Chicken & Vegetables (Batch #1)',
      recipeId: defaultRecipes[2].id,
      prepDate: getDatePlusDays(-14),
      useByDate: getDatePlusDays(76),
      servings: 4,
      notes: 'Storage: Freezer-safe bag',
      reheatInstructions: `Oven: Bake at 350°F for 25-30 minutes until heated through
Microwave: Heat on high for 5-7 minutes
From Frozen: Thaw in refrigerator overnight for best results`,
    },
  ];

  console.log('[DefaultContent] Created default content:', {
    inventory: defaultInventory.length,
    recipes: defaultRecipes.length,
    freezerMeals: defaultFreezerMeals.length,
  });

  return {
    inventory: defaultInventory,
    recipes: defaultRecipes,
    freezerMeals: defaultFreezerMeals,
  };
}

export async function resetToDefaultContent(): Promise<{
  inventory: InventoryItem[];
  recipes: Recipe[];
  freezerMeals: FreezerMeal[];
}> {
  console.log('[DefaultContent] Resetting to default content');
  return loadDefaultContent();
}
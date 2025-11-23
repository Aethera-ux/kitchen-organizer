export const RECIPE_TAGS = {
  mealType: [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Dessert',
    'Appetizer',
    'Side Dish',
  ],
  cuisine: [
    'Italian',
    'Mexican',
    'Asian',
    'Chinese',
    'Thai',
    'Japanese',
    'Indian',
    'American',
    'Mediterranean',
    'French',
    'Greek',
    'Middle Eastern',
  ],
  dietary: [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo',
    'Low-Carb',
    'Whole30',
    'Nut-Free',
    'Soy-Free',
    'Egg-Free',
  ],
  difficulty: [
    'Easy',
    'Medium',
    'Hard',
    'Beginner-Friendly',
  ],
  speed: [
    'Under 15 min',
    'Under 30 min',
    'Under 1 hour',
    'Quick & Easy',
    'Long Cook',
  ],
  cookingMethod: [
    'One-Pot',
    'Slow Cooker',
    'Instant Pot',
    'Air Fryer',
    'Baking',
    'Grilling',
    'Stovetop',
    'No-Cook',
  ],
  special: [
    'Freezer-Friendly',
    'Meal Prep',
    'Batch Cooking',
    'Budget-Friendly',
    'Kid-Friendly',
    'High-Protein',
    'Comfort Food',
    'Healthy',
    'Low-Calorie',
    'Make-Ahead',
  ],
  season: [
    'Spring',
    'Summer',
    'Fall',
    'Winter',
    'Holiday',
    'Year-Round',
  ],
};

export const getAllTags = () => {
  const allTags: string[] = [];
  Object.values(RECIPE_TAGS).forEach(tagGroup => {
    allTags.push(...tagGroup);
  });
  return allTags;
};

export const getTagCategory = (tag: string) => {
  for (const [category, tags] of Object.entries(RECIPE_TAGS)) {
    if (tags.includes(tag)) {
      return category;
    }
  }
  return 'custom';
};
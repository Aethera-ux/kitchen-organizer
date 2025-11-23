import { Recipe, Ingredient, MacroNutrients } from '@/contexts/KitchenContext';

type ParsedRecipe = {
  name: string;
  servings?: number;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  instructions?: string;
  ingredients: Ingredient[];
  macros?: MacroNutrients;
  imageUrl?: string;
  sourceUrl?: string;
};

const parseTime = (timeString?: string): string | undefined => {
  if (!timeString) return undefined;
  
  const match = timeString.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return timeString;
  
  const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
  const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
  
  if (hours && minutes) return `${hours}h ${minutes}min`;
  if (hours) return `${hours}h`;
  if (minutes) return `${minutes}min`;
  
  return undefined;
};

const parseIngredients = (ingredients: any[]): Ingredient[] => {
  return ingredients.map((ing, index) => {
    let name: string;
    let quantity = 1;
    let unit = 'item';
    
    if (typeof ing === 'string') {
      const match = ing.match(/^([\d\.\s\/]+)?\s*([\w]+)?\s+(.+)/);
      if (match) {
        const [, qty, unitStr, nameStr] = match;
        if (qty) quantity = parseFloat(qty.replace(/[^\d.]/g, '')) || 1;
        if (unitStr) unit = unitStr;
        name = nameStr || ing;
      } else {
        name = ing;
      }
    } else if (typeof ing === 'object') {
      name = ing.name || ing.text || '';
      quantity = ing.amount || ing.quantity || 1;
      unit = ing.unit || 'item';
    } else {
      name = String(ing);
    }
    
    return {
      id: `${Date.now()}-${index}`,
      name: name.trim(),
      quantity,
      unit,
      category: 'pantry',
    };
  });
};

const findJsonLdScript = (html: string): any | null => {
  const scripts = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  
  for (const script of scripts) {
    const content = script.replace(/<script[^>]*>|<\/script>/gi, '');
    try {
      const json = JSON.parse(content);
      if (json['@type'] === 'Recipe' || json['@type']?.includes('Recipe')) {
        return json;
      }
      if (json['@graph']) {
        const recipe = json['@graph'].find((item: any) => 
          item['@type'] === 'Recipe' || item['@type']?.includes('Recipe')
        );
        if (recipe) return recipe;
      }
    } catch (e) {
      console.log('Failed to parse JSON-LD:', e);
    }
  }
  
  return null;
};

const parseMicrodata = (html: string): ParsedRecipe | null => {
  // Basic microdata parsing fallback
  const nameMatch = html.match(/itemprop="name"[^>]*>([^<]+)</);
  const name = nameMatch ? nameMatch[1].trim() : null;
  
  if (!name) return null;
  
  const ingredientMatches = html.match(/itemprop="recipeIngredient"[^>]*>([^<]+)</g) || [];
  const ingredients = ingredientMatches.map(match => {
    const content = match.replace(/.*>/, '').trim();
    return content;
  });
  
  return {
    name,
    ingredients: parseIngredients(ingredients),
    instructions: '',
  };
};

export const parseRecipeFromUrl = async (url: string): Promise<ParsedRecipe> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Try JSON-LD first
    const jsonLd = findJsonLdScript(html);
    if (jsonLd) {
      const recipe: ParsedRecipe = {
        name: jsonLd.name || '',
        servings: jsonLd.recipeYield ? parseInt(jsonLd.recipeYield) : undefined,
        prepTime: parseTime(jsonLd.prepTime),
        cookTime: parseTime(jsonLd.cookTime),
        totalTime: parseTime(jsonLd.totalTime),
        instructions: '',
        ingredients: [],
        imageUrl: jsonLd.image?.url || jsonLd.image || undefined,
        sourceUrl: url,
      };
      
      // Parse instructions
      if (jsonLd.recipeInstructions) {
        if (Array.isArray(jsonLd.recipeInstructions)) {
          recipe.instructions = jsonLd.recipeInstructions
            .map((inst: any, index: number) => {
              if (typeof inst === 'string') return `${index + 1}. ${inst}`;
              if (inst.text) return `${index + 1}. ${inst.text}`;
              if (inst.name) return `${index + 1}. ${inst.name}`;
              return '';
            })
            .filter(Boolean)
            .join('\n\n');
        } else if (typeof jsonLd.recipeInstructions === 'string') {
          recipe.instructions = jsonLd.recipeInstructions;
        }
      }
      
      // Parse ingredients
      if (jsonLd.recipeIngredient) {
        recipe.ingredients = parseIngredients(jsonLd.recipeIngredient);
      }
      
      // Parse nutrition
      if (jsonLd.nutrition) {
        const nutrition = jsonLd.nutrition;
        recipe.macros = {
          calories: parseFloat(nutrition.calories) || undefined,
          protein: parseFloat(nutrition.proteinContent) || undefined,
          carbs: parseFloat(nutrition.carbohydrateContent) || undefined,
          fat: parseFloat(nutrition.fatContent) || undefined,
          fiber: parseFloat(nutrition.fiberContent) || undefined,
          sugar: parseFloat(nutrition.sugarContent) || undefined,
          sodium: parseFloat(nutrition.sodiumContent) || undefined,
        };
      }
      
      return recipe;
    }
    
    // Try microdata fallback
    const microdata = parseMicrodata(html);
    if (microdata) {
      return { ...microdata, sourceUrl: url };
    }
    
    throw new Error('Could not parse recipe from this URL');
  } catch (error) {
    console.error('Error parsing recipe:', error);
    throw error;
  }
};

export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
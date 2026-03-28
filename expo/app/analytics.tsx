import { StyleSheet, Text, View, ScrollView, Dimensions, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useKitchen } from '@/contexts/KitchenContext';
import { useMemo } from 'react';
import { TrendingUp, Award, ChefHat, Package, Calendar, DollarSign } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const { meals, recipes, freezerMeals, inventory, leftovers } = useKitchen();
  
  const stats = useMemo(() => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    const mealsThisMonth = meals.filter(meal => {
      const mealDate = new Date(meal.date);
      return mealDate.getMonth() === thisMonth && mealDate.getFullYear() === thisYear;
    }).length;
    
    const moneySaved = mealsThisMonth * 15;
    
    const mostCookedRecipes = recipes
      .filter(r => r.timesMade && r.timesMade > 0)
      .sort((a, b) => (b.timesMade || 0) - (a.timesMade || 0))
      .slice(0, 5);
    
    const highestRatedRecipes = recipes
      .filter(r => r.rating && r.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
    
    const favoriteCount = recipes.filter(r => r.isFavorite).length;
    
    const pantryStaplesCount = inventory.filter(i => i.isPantryStaple).length;
    const lowStockCount = inventory.filter(i => i.isRunningLow).length;
    
    const expiringLeftovers = leftovers.filter(leftover => {
      const useByDate = new Date(leftover.useByDate);
      const daysUntilExpiry = Math.ceil((useByDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 2 && daysUntilExpiry >= 0;
    }).length;
    
    return {
      mealsThisMonth,
      moneySaved,
      totalRecipes: recipes.length,
      totalFreezerMeals: freezerMeals.length,
      mostCookedRecipes,
      highestRatedRecipes,
      favoriteCount,
      pantryStaplesCount,
      lowStockCount,
      expiringLeftovers,
      leftoversCount: leftovers.length,
    };
  }, [meals, recipes, freezerMeals, inventory, leftovers]);
  
  const styles = createStyles(colors, isDark);
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Analytics',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10b98120' }]}>
              <Calendar size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.mealsThisMonth}</Text>
            <Text style={styles.statLabel}>Meals This Month</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}>
              <DollarSign size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>${stats.moneySaved}</Text>
            <Text style={styles.statLabel}>Money Saved</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.smallStat}>
              <Text style={styles.smallStatValue}>{stats.totalRecipes}</Text>
              <Text style={styles.smallStatLabel}>Total Recipes</Text>
            </View>
            <View style={styles.smallStat}>
              <Text style={styles.smallStatValue}>{stats.favoriteCount}</Text>
              <Text style={styles.smallStatLabel}>Favorites</Text>
            </View>
            <View style={styles.smallStat}>
              <Text style={styles.smallStatValue}>{stats.totalFreezerMeals}</Text>
              <Text style={styles.smallStatLabel}>Freezer Meals</Text>
            </View>
          </View>
        </View>
        
        {stats.mostCookedRecipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Cooked Recipes</Text>
            {stats.mostCookedRecipes.map((recipe, index) => (
              <View key={recipe.id} style={styles.listItem}>
                <View style={styles.listRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{recipe.name}</Text>
                  <Text style={styles.listSubtitle}>Made {recipe.timesMade} times</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {stats.highestRatedRecipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Highest Rated Recipes</Text>
            {stats.highestRatedRecipes.map((recipe, index) => (
              <View key={recipe.id} style={styles.listItem}>
                <View style={[styles.listRank, { backgroundColor: '#f59e0b20' }]}>
                  <Text style={[styles.rankText, { color: '#f59e0b' }]}>⭐</Text>
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{recipe.name}</Text>
                  <Text style={styles.listSubtitle}>{recipe.rating}/5 stars</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Status</Text>
          <View style={styles.inventoryGrid}>
            <View style={styles.inventoryCard}>
              <Package size={20} color="#10b981" />
              <Text style={styles.inventoryValue}>{stats.pantryStaplesCount}</Text>
              <Text style={styles.inventoryLabel}>Pantry Staples</Text>
            </View>
            <View style={styles.inventoryCard}>
              <TrendingUp size={20} color="#f59e0b" />
              <Text style={styles.inventoryValue}>{stats.lowStockCount}</Text>
              <Text style={styles.inventoryLabel}>Low Stock Items</Text>
            </View>
          </View>
        </View>
        
        {stats.leftoversCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leftovers</Text>
            <View style={styles.alertCard}>
              <Text style={styles.alertText}>You have {stats.leftoversCount} leftover{stats.leftoversCount !== 1 ? 's' : ''}</Text>
              {stats.expiringLeftovers > 0 && (
                <Text style={styles.alertWarning}>{stats.expiringLeftovers} expiring soon!</Text>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {stats.mealsThisMonth >= 10 && (
              <View style={styles.achievement}>
                <Award size={32} color="#10b981" />
                <Text style={styles.achievementTitle}>Meal Prep Pro</Text>
                <Text style={styles.achievementDesc}>10+ meals this month</Text>
              </View>
            )}
            {stats.totalRecipes >= 10 && (
              <View style={styles.achievement}>
                <ChefHat size={32} color="#3b82f6" />
                <Text style={styles.achievementTitle}>Recipe Master</Text>
                <Text style={styles.achievementDesc}>10+ recipes saved</Text>
              </View>
            )}
            {stats.moneySaved >= 100 && (
              <View style={styles.achievement}>
                <DollarSign size={32} color="#f59e0b" />
                <Text style={styles.achievementTitle}>Money Saver</Text>
                <Text style={styles.achievementDesc}>$100+ saved</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallStat: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallStatValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  smallStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  inventoryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  inventoryCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  inventoryValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
  },
  inventoryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertText: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  alertWarning: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600' as const,
  },
  achievementsSection: {
    marginBottom: 32,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievement: {
    width: (width - 32 - 12) / 2,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
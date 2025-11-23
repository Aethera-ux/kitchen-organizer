import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Check, Sparkles, Calendar, ChefHat, Zap } from 'lucide-react-native';
import { useState } from 'react';

const FEATURES = [
  { icon: ChefHat, text: 'Unlimited recipe storage' },
  { icon: Calendar, text: 'Plan meals beyond 14 days' },
  { icon: Zap, text: 'Advanced meal planning tools' },
  { icon: Sparkles, text: 'Priority support' },
];

export default function PaywallScreen() {
  const { offerings, purchasePackage, restorePurchases, isPro } = useRevenueCat();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  const handlePurchase = async (pkg: any) => {
    setLoading(true);
    setSelectedPackageId(pkg.identifier);
    
    try {
      const result = await purchasePackage(pkg);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Welcome to Meal Prepper Pro! 🎉',
          [{ text: 'Get Started', onPress: () => router.back() }]
        );
      } else if (result.error && result.error !== 'Purchase cancelled') {
        Alert.alert('Purchase Failed', result.error);
      }
    } catch (error) {
      console.error('[Paywall] Purchase error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setSelectedPackageId('');
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        Alert.alert(
          'Restored!',
          'Your purchases have been restored.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases.');
      }
    } catch (error) {
      console.error('[Paywall] Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setLoading(false);
    }
  };

  if (isPro) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Subscription', presentation: 'modal' }} />
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.primary + '20' }]}>
            <Check size={48} color={colors.primary} strokeWidth={3} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>You're a Pro!</Text>
          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            Thank you for supporting Meal Prepper
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentOffering = offerings[0];
  const packages = currentOffering?.availablePackages || [];

  // Sort packages: yearly, monthly, weekly
  const sortedPackages = [...packages].sort((a, b) => {
    const order = { yearly: 1, annual: 1, monthly: 2, weekly: 3 };
    const aKey = a.identifier.toLowerCase();
    const bKey = b.identifier.toLowerCase();
    const aOrder = Object.entries(order).find(([key]) => aKey.includes(key))?.[1] || 99;
    const bOrder = Object.entries(order).find(([key]) => bKey.includes(key))?.[1] || 99;
    return aOrder - bOrder;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Upgrade to Pro',
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerCloseButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Sparkles size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Unlock Meal Prepper Pro</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Get unlimited access to all premium features
          </Text>
        </View>

        <View style={[styles.featuresSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Icon size={20} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>{feature.text}</Text>
              </View>
            );
          })}
        </View>

        {sortedPackages.length > 0 ? (
          <View style={styles.packagesSection}>
            <Text style={[styles.packagesTitle, { color: colors.text }]}>Choose Your Plan</Text>
            {sortedPackages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.identifier;
              const isPopular = pkg.identifier.toLowerCase().includes('annual') || 
                               pkg.identifier.toLowerCase().includes('yearly');
              
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isPopular && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => handlePurchase(pkg)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {isPopular && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                  )}
                  
                  <View style={styles.packageHeader}>
                    <View style={styles.packageInfo}>
                      <Text style={[styles.packageTitle, { color: colors.text }]}>
                        {pkg.product.title.replace('(Meal Prepper)', '').trim()}
                      </Text>
                      {pkg.product.description && (
                        <Text style={[styles.packageDescription, { color: colors.textSecondary }]}>
                          {pkg.product.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.packagePricing}>
                      <Text style={[styles.packagePrice, { color: colors.primary }]}>
                        {pkg.product.priceString}
                      </Text>
                      {pkg.product.subscriptionPeriod && (
                        <Text style={[styles.packagePeriod, { color: colors.textSecondary }]}>
                          /{pkg.product.subscriptionPeriod === 'P1Y' ? 'year' : 
                            pkg.product.subscriptionPeriod === 'P1M' ? 'month' : 
                            pkg.product.subscriptionPeriod === 'P1W' ? 'week' : 'period'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {isSelected && loading ? (
                    <ActivityIndicator color={colors.primary} style={styles.packageLoader} />
                  ) : (
                    <View style={[styles.packageAction, { backgroundColor: colors.primary }]}>
                      <Text style={styles.packageActionText}>Subscribe</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Loading subscription plans...
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={[styles.restoreButtonText, { color: colors.primary }]}>
            {loading ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
          Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCloseButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500' as const,
    flex: 1,
  },
  packagesSection: {
    marginBottom: 24,
  },
  packagesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  packageCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  packageInfo: {
    flex: 1,
    marginRight: 12,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
  },
  packagePricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  packagePeriod: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  packageAction: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  packageActionText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  packageLoader: {
    paddingVertical: 14,
  },
  restoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 16,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});

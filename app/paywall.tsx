import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
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
        Alert.alert('No Purchases Found', 'We couldn&apos;t find any previous purchases.');
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
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Subscription', presentation: 'modal' }} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Check size={48} color="#10b981" strokeWidth={3} />
          </View>
          <Text style={styles.successTitle}>You're a Pro!</Text>
          <Text style={styles.successText}>
            Thank you for supporting Meal Prepper
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
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

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Upgrade to Pro',
          presentation: 'modal',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerCloseButton}>
              <X size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
        }} 
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Sparkles size={48} color="#10b981" />
          </View>
          <Text style={styles.title}>Unlock Meal Prepper Pro</Text>
          <Text style={styles.subtitle}>
            Get unlimited access to all premium features
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Icon size={20} color="#10b981" />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            );
          })}
        </View>

        {packages.length > 0 ? (
          <View style={styles.packagesSection}>
            <Text style={styles.packagesTitle}>Choose Your Plan</Text>
            {packages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.identifier;
              const isPopular = pkg.identifier.includes('annual') || pkg.identifier.includes('yearly');
              
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    isPopular && styles.packageCardPopular,
                  ]}
                  onPress={() => handlePurchase(pkg)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                  )}
                  
                  <View style={styles.packageHeader}>
                    <View style={styles.packageInfo}>
                      <Text style={styles.packageTitle}>
                        {pkg.product.title.replace('(Meal Prepper)', '').trim()}
                      </Text>
                      {pkg.product.description && (
                        <Text style={styles.packageDescription}>
                          {pkg.product.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.packagePricing}>
                      <Text style={styles.packagePrice}>
                        {pkg.product.priceString}
                      </Text>
                      {pkg.product.subscriptionPeriod && (
                        <Text style={styles.packagePeriod}>
                          /{pkg.product.subscriptionPeriod === 'P1Y' ? 'year' : 
                            pkg.product.subscriptionPeriod === 'P1M' ? 'month' : 
                            pkg.product.subscriptionPeriod === 'P1W' ? 'week' : 'period'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {isSelected && loading ? (
                    <ActivityIndicator color="#10b981" style={styles.packageLoader} />
                  ) : (
                    <View style={styles.packageAction}>
                      <Text style={styles.packageActionText}>Subscribe</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No subscription plans available</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={styles.restoreButtonText}>
            {loading ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
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
    backgroundColor: '#10b98115',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500' as const,
    flex: 1,
  },
  packagesSection: {
    marginBottom: 24,
  },
  packagesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
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
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    }),
  },
  packageCardPopular: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#10b981',
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
    color: '#0f172a',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  packagePricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#10b981',
  },
  packagePeriod: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  packageAction: {
    backgroundColor: '#10b981',
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
    color: '#10b981',
  },
  disclaimer: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
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
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#0f172a',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  closeButton: {
    backgroundColor: '#10b981',
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

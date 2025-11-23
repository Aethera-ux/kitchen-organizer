import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Crown, RefreshCw, Settings, HelpCircle } from 'lucide-react-native';
import { useState } from 'react';

export default function CustomerCenterScreen() {
  const { isPro, customerInfo, restorePurchases } = useRevenueCat();
  const { colors } = useTheme();
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        Alert.alert('Success', 'Your purchases have been restored.');
      } else {
        Alert.alert('No Purchases Found', 'We couldn&apos;t find any previous purchases.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/paywall');
  };

  const getSubscriptionInfo = () => {
    if (!customerInfo || !isPro) return null;

    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    if (activeEntitlements.length === 0) return null;

    const entitlement = activeEntitlements[0];
    const expirationDate = entitlement.expirationDate;
    
    return {
      isActive: true,
      expirationDate: expirationDate ? new Date(expirationDate).toLocaleDateString() : null,
      productIdentifier: entitlement.productIdentifier,
      willRenew: entitlement.willRenew,
    };
  };

  const subscriptionInfo = getSubscriptionInfo();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Account', 
          headerLargeTitle: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, isPro && styles.statusIconPro]}>
              <Crown size={32} color={isPro ? '#10b981' : '#94a3b8'} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {isPro ? 'Meal Prepper Pro' : 'Free Plan'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isPro ? 'Active Subscription' : 'Limited Features'}
              </Text>
            </View>
          </View>

          {isPro && subscriptionInfo ? (
            <View style={styles.subscriptionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, styles.detailValueActive]}>Active</Text>
              </View>
              {subscriptionInfo.expirationDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {subscriptionInfo.willRenew ? 'Renews on' : 'Expires on'}
                  </Text>
                  <Text style={styles.detailValue}>{subscriptionInfo.expirationDate}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan</Text>
                <Text style={styles.detailValue}>{subscriptionInfo.productIdentifier}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.freeTierInfo}>
              <Text style={styles.freeTierTitle}>Free Tier Limits:</Text>
              <Text style={styles.freeTierItem}>• Maximum 5 recipes</Text>
              <Text style={styles.freeTierItem}>• Plan up to 14 days ahead</Text>
              <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage Subscription</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleRestore}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator color="#10b981" />
            ) : (
              <RefreshCw size={20} color={colors.text} />
            )}
            <Text style={styles.menuItemText}>Restore Purchases</Text>
          </TouchableOpacity>

          {!isPro && (
            <TouchableOpacity style={styles.menuItem} onPress={handleUpgrade}>
              <Crown size={20} color={colors.text} />
              <Text style={styles.menuItemText}>View Plans</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>

          <TouchableOpacity style={styles.menuItem}>
            <HelpCircle size={20} color={colors.text} />
            <Text style={styles.menuItemText}>FAQs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Settings size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            To manage your subscription, visit your device&apos;s App Store settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: colors.surface,
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusIconPro: {
    backgroundColor: '#10b98120',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  subscriptionDetails: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600' as const,
  },
  detailValueActive: {
    color: '#10b981',
  },
  freeTierInfo: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  freeTierTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  freeTierItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  upgradeButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
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
  menuItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500' as const,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

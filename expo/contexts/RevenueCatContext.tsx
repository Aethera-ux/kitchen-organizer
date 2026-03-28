import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

const API_KEY = 'test_fkFFvhrOMDJjOfWOafTyzBlpEwd';
const ENTITLEMENT_ID = 'Meal Prepper Pro';

export type SubscriptionStatus = {
  isPro: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering[];
};

export const [RevenueCatProvider, useRevenueCat] = createContextHook(() => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      console.log('[RevenueCat] Initializing...');
      
      if (Platform.OS !== 'web') {
        // Set log level for debugging
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        
        // Configure RevenueCat
        await Purchases.configure({ apiKey: API_KEY });
        console.log('[RevenueCat] Configured successfully');

        // Get customer info
        const info = await Purchases.getCustomerInfo();
        console.log('[RevenueCat] Customer info loaded:', {
          activeEntitlements: Object.keys(info.entitlements.active),
          allEntitlements: Object.keys(info.entitlements.all),
        });
        setCustomerInfo(info);
        updateProStatus(info);

        // Get offerings
        const offerings = await Purchases.getOfferings();
        console.log('[RevenueCat] Offerings loaded:', {
          current: offerings.current?.identifier,
          all: offerings.all ? Object.keys(offerings.all) : [],
          packages: offerings.current?.availablePackages.map(p => ({
            identifier: p.identifier,
            product: p.product.identifier,
          })),
        });
        
        if (offerings.current) {
          setOfferings([offerings.current]);
        }

        // Listen for customer info updates
        Purchases.addCustomerInfoUpdateListener((info) => {
          console.log('[RevenueCat] Customer info updated');
          setCustomerInfo(info);
          updateProStatus(info);
        });
      } else {
        console.log('[RevenueCat] Web platform - using free tier');
        setIsPro(false);
      }
    } catch (error) {
      console.error('[RevenueCat] Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProStatus = (info: CustomerInfo) => {
    const hasProEntitlement =
      typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    console.log('[RevenueCat] Pro status:', hasProEntitlement);
    setIsPro(hasProEntitlement);
  };

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> => {
      if (Platform.OS === 'web') {
        return { success: false, error: 'Purchases not supported on web' };
      }

      try {
        console.log('[RevenueCat] Starting purchase:', pkg.identifier);
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        setCustomerInfo(customerInfo);
        updateProStatus(customerInfo);
        console.log('[RevenueCat] Purchase successful');
        return { success: true };
      } catch (error: any) {
        console.error('[RevenueCat] Purchase error:', error);
        if (error.userCancelled) {
          return { success: false, error: 'Purchase cancelled' };
        }
        return { success: false, error: error.message || 'Purchase failed' };
      }
    },
    []
  );

  const restorePurchases = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (Platform.OS === 'web') {
      return { success: false, error: 'Restore not supported on web' };
    }

    try {
      console.log('[RevenueCat] Restoring purchases');
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);
      updateProStatus(customerInfo);
      
      const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0;
      console.log('[RevenueCat] Restore successful, active subscriptions:', hasActiveSubscription);
      
      return { success: hasActiveSubscription };
    } catch (error: any) {
      console.error('[RevenueCat] Restore error:', error);
      return { success: false, error: error.message || 'Restore failed' };
    }
  }, []);

  return useMemo(
    () => ({
      isPro,
      isLoading,
      customerInfo,
      offerings,
      purchasePackage,
      restorePurchases,
    }),
    [isPro, isLoading, customerInfo, offerings, purchasePackage, restorePurchases]
  );
});

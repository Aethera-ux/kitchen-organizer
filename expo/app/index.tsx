import { Redirect } from 'expo-router';
import { useKitchen } from '@/contexts/KitchenContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { onboardingCompleted, isLoading } = useKitchen();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/inventory" />;
}

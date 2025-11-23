import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform, Animated } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useKitchen } from '@/contexts/KitchenContext';
import { Package, ChefHat, Calendar, ShoppingBag } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type OnboardingSlide = {
  id: number;
  title: string;
  description: string;
  icon: typeof Package;
  color: string;
};

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Track Your Kitchen',
    description: 'Keep inventory of ingredients, mark pantry staples, and never run out of essentials.',
    icon: Package,
    color: '#10b981',
  },
  {
    id: 2,
    title: 'Manage Recipes',
    description: 'Save favorite recipes, track macros, rate meals, and add personal notes.',
    icon: ChefHat,
    color: '#3b82f6',
  },
  {
    id: 3,
    title: 'Plan Your Meals',
    description: 'Create weekly meal plans, utilize freezer meals, and stay organized.',
    icon: Calendar,
    color: '#f59e0b',
  },
  {
    id: 4,
    title: 'Smart Shopping',
    description: 'Generate shopping lists from meal plans and check off items as you shop.',
    icon: ShoppingBag,
    color: '#8b5cf6',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useKitchen();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      Animated.spring(translateX, {
        toValue: -nextIndex * width,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      Animated.spring(translateX, {
        toValue: -prevIndex * width,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/inventory');
  };

  const handleGetStarted = () => {
    completeOnboarding();
    router.replace('/(tabs)/inventory');
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.slidesContainer, { transform: [{ translateX }] }]}>
        {slides.map((slide) => {
          const Icon = slide.icon;
          return (
            <View key={slide.id} style={[styles.slide, { width }]}>
              <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
                <Icon size={64} color={slide.color} />
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          );
        })}
      </Animated.View>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {currentIndex > 0 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {!isLastSlide ? (
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleGetStarted} style={styles.getStartedButton}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  slidesContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#10b981',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    minWidth: 100,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748b',
    textAlign: 'center',
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    minWidth: 100,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
  },
  getStartedButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    flex: 1,
    marginLeft: 12,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center',
  },
});

import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform, Switch, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { Moon, Sun, Monitor, Crown, HelpCircle, Mail, FileText, UserCircle, ChevronRight, BarChart, Bell, Salad } from 'lucide-react-native';
import { useState } from 'react';

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

type SettingsItem = {
  id: string;
  label: string;
  icon: any;
  type: 'navigation' | 'toggle' | 'select';
  onPress?: () => void;
  value?: any;
  rightText?: string;
};

export default function SettingsScreen() {
  const { themeMode, setThemeMode, isDark, colors } = useTheme();
  const { isPro, customerInfo } = useRevenueCat();
  const [showThemeOptions, setShowThemeOptions] = useState(false);

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    setShowThemeOptions(false);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@mealprepper.com?subject=Support Request');
  };

  const handleViewHelp = () => {
    Alert.alert('Help & FAQ', 'Help documentation coming soon!');
  };

  const handleAbout = () => {
    Alert.alert(
      'About Meal Prepper',
      'Version 1.0.0\n\nA comprehensive meal planning and kitchen management app.\n\n© 2025 Meal Prepper',
      [{ text: 'OK' }]
    );
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerLargeTitle: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {isPro && (
          <View style={styles.proCard}>
            <View style={styles.proIcon}>
              <Crown size={24} color="#10b981" />
            </View>
            <View style={styles.proInfo}>
              <Text style={styles.proTitle}>Meal Prepper Pro</Text>
              <Text style={styles.proSubtitle}>You have access to all premium features</Text>
            </View>
            <TouchableOpacity
              style={styles.proButton}
              onPress={() => router.push('/customer-center')}
            >
              <Text style={styles.proButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => router.push('/paywall')}
            activeOpacity={0.7}
          >
            <Crown size={20} color="#10b981" />
            <Text style={styles.upgradeText}>Upgrade to Pro</Text>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowThemeOptions(!showThemeOptions)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              {isDark ? (
                <Moon size={20} color={colors.text} />
              ) : (
                <Sun size={20} color={colors.text} />
              )}
              <Text style={styles.settingLabel}>Theme</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{getThemeLabel()}</Text>
              <ChevronRight size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {showThemeOptions && (
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('light')}
                activeOpacity={0.7}
              >
                <Sun size={18} color={themeMode === 'light' ? '#10b981' : colors.textSecondary} />
                <Text style={[styles.themeOptionText, themeMode === 'light' && styles.themeOptionTextActive]}>
                  Light
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('dark')}
                activeOpacity={0.7}
              >
                <Moon size={18} color={themeMode === 'dark' ? '#10b981' : colors.textSecondary} />
                <Text style={[styles.themeOptionText, themeMode === 'dark' && styles.themeOptionTextActive]}>
                  Dark
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.themeOption, themeMode === 'system' && styles.themeOptionActive]}
                onPress={() => handleThemeChange('system')}
                activeOpacity={0.7}
              >
                <Monitor size={18} color={themeMode === 'system' ? '#10b981' : colors.textSecondary} />
                <Text style={[styles.themeOptionText, themeMode === 'system' && styles.themeOptionTextActive]}>
                  System
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/analytics')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <BarChart size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Analytics Dashboard</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/leftovers')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Salad size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Leftovers Tracking</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/notifications-settings')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/customer-center')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <UserCircle size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Manage Subscription</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleViewHelp}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <HelpCircle size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Help & FAQ</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Mail size={20} color={colors.text} />
              <Text style={styles.settingLabel}>Contact Support</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleAbout}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <FileText size={20} color={colors.text} />
              <Text style={styles.settingLabel}>App Information</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Made with ♥ for meal planning enthusiasts
        </Text>
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
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10b981',
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(16, 185, 129, 0.2)',
      },
    }),
  },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  proInfo: {
    flex: 1,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  proSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  proButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  proButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
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
  upgradeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  themeOptions: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  themeOptionActive: {
    backgroundColor: '#10b98110',
  },
  themeOptionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  themeOptionTextActive: {
    color: '#10b981',
    fontWeight: '600' as const,
  },
  footer: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 24,
  },
});

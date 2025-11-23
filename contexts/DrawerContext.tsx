import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { Modal, View, TouchableOpacity, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { useRevenueCat } from './RevenueCatContext';
import { router } from 'expo-router';
import { Settings, BarChart3, Info, Bell, Coffee, Moon, Sun, Menu, X } from 'lucide-react-native';

interface DrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
}

interface DrawerProviderProps {
  children: ReactNode;
}

export function DrawerProvider({ children }: DrawerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen(prev => !prev), []);

  const contextValue = useMemo(
    () => ({ isOpen, openDrawer, closeDrawer, toggleDrawer }),
    [isOpen, openDrawer, closeDrawer, toggleDrawer]
  );

  const menuItems = [
    { title: 'Settings', icon: Settings, route: '/settings' },
    { title: 'Analytics', icon: BarChart3, route: '/analytics', isPro: true },
    { title: 'Notifications', icon: Bell, route: '/notifications-settings' },
    { title: 'Leftovers', icon: Coffee, route: '/leftovers' },
    { title: 'Customer Center', icon: Info, route: '/customer-center' },
  ];

  const handleMenuItemPress = (route: string | null, isPro?: boolean) => {
    if (isPro && !customerInfo?.entitlements.active["Meal Prepper Pro"]?.isActive) {
      router.push('/paywall');
    } else if (route) {
      router.push(route as any);
    }
    closeDrawer();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawerContent: {
      width: '80%',
      maxWidth: 320,
      height: '100%',
      backgroundColor: colors.surface,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '2px 0 10px rgba(0,0,0,0.25)',
        } as any,
      }),
    },
    drawerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: insets.top + 20,
      paddingBottom: 20,
    },
    drawerTitle: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    themeSection: {
      marginHorizontal: 16,
      marginBottom: 20,
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.surfaceElevated,
    },
    themeHeader: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      color: colors.text,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    themeOption: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    themeOptionActive: {
      borderWidth: 1,
      borderColor: '#10b981',
      backgroundColor: colors.primary + '20',
    },
    themeOptionText: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
    menuItems: {
      flex: 1,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    menuItemText: {
      fontSize: 16,
      color: colors.text,
    },
    proBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    proBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700' as const,
    },
    footer: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    versionText: {
      fontSize: 12,
      textAlign: 'center' as const,
      color: colors.textTertiary,
    },
  });

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDrawer}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeDrawer}
        >
          <View 
            style={styles.drawerContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Meal Prepper</Text>
              <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.themeSection}>
              <View style={styles.themeHeader}>
                <Text style={styles.sectionTitle}>Theme</Text>
              </View>
              <View style={styles.themeOptions}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeMode === 'light' && styles.themeOptionActive
                  ]}
                  onPress={() => setThemeMode('light')}
                >
                  <Sun size={20} color={themeMode === 'light' ? colors.primary : colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: themeMode === 'light' ? colors.primary : colors.textSecondary }
                  ]}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeMode === 'dark' && styles.themeOptionActive
                  ]}
                  onPress={() => setThemeMode('dark')}
                >
                  <Moon size={20} color={themeMode === 'dark' ? colors.primary : colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: themeMode === 'dark' ? colors.primary : colors.textSecondary }
                  ]}>Dark</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    themeMode === 'system' && styles.themeOptionActive
                  ]}
                  onPress={() => setThemeMode('system')}
                >
                  <Settings size={20} color={themeMode === 'system' ? colors.primary : colors.textSecondary} />
                  <Text style={[
                    styles.themeOptionText,
                    { color: themeMode === 'system' ? colors.primary : colors.textSecondary }
                  ]}>Auto</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.menuItems}>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={() => handleMenuItemPress(item.route, item.isPro)}
                  >
                    <View style={styles.menuItemLeft}>
                      <Icon size={22} color={colors.textSecondary} />
                      <Text style={styles.menuItemText}>
                        {item.title}
                      </Text>
                    </View>
                    {item.isPro && !customerInfo?.entitlements.active["Meal Prepper Pro"]?.isActive && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </DrawerContext.Provider>
  );
}

export function DrawerMenuButton() {
  const { openDrawer } = useDrawer();
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      onPress={openDrawer} 
      style={{ padding: 8, marginLeft: 8 }}
    >
      <Menu size={24} color={colors.text} />
    </TouchableOpacity>
  );
}

import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useKitchen } from '@/contexts/KitchenContext';
import { Bell, Calendar, Snowflake, Package, ShoppingBag, Clock } from 'lucide-react-native';
import { useState, useEffect } from 'react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_OPTIONS = [
  { value: '06:00', label: '6:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '20:00', label: '8:00 PM' },
];

export default function NotificationSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { notificationSettings, updateNotificationSettings } = useKitchen();
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const handleToggle = (key: keyof typeof notificationSettings, value: boolean) => {
    updateNotificationSettings({ [key]: value });
  };
  
  const handleDayChange = (day: number) => {
    updateNotificationSettings({ weeklyMealPrepDay: day });
    setShowDayPicker(false);
  };
  
  const handleTimeChange = (time: string) => {
    updateNotificationSettings({ weeklyMealPrepTime: time });
    setShowTimePicker(false);
  };
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  const styles = createStyles(colors, isDark);
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Prep Reminders</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Calendar size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Weekly Meal Prep</Text>
                <Text style={styles.settingDescription}>Reminder to prep for the week</Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.weeklyMealPrepReminder}
              onValueChange={(value) => handleToggle('weeklyMealPrepReminder', value)}
              trackColor={{ false: colors.border, true: '#10b981' }}
              thumbColor={notificationSettings.weeklyMealPrepReminder ? '#fff' : colors.textTertiary}
            />
          </View>
          
          {notificationSettings.weeklyMealPrepReminder && (
            <>
              <TouchableOpacity
                style={styles.subSettingItem}
                onPress={() => setShowDayPicker(!showDayPicker)}
                activeOpacity={0.7}
              >
                <Text style={styles.subSettingLabel}>Day</Text>
                <View style={styles.subSettingValue}>
                  <Text style={styles.subSettingValueText}>
                    {DAYS_OF_WEEK.find(d => d.value === notificationSettings.weeklyMealPrepDay)?.label}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
              
              {showDayPicker && (
                <View style={styles.optionsList}>
                  {DAYS_OF_WEEK.map(day => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.optionItem,
                        notificationSettings.weeklyMealPrepDay === day.value && styles.optionItemActive
                      ]}
                      onPress={() => handleDayChange(day.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.optionText,
                        notificationSettings.weeklyMealPrepDay === day.value && styles.optionTextActive
                      ]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <TouchableOpacity
                style={styles.subSettingItem}
                onPress={() => setShowTimePicker(!showTimePicker)}
                activeOpacity={0.7}
              >
                <Text style={styles.subSettingLabel}>Time</Text>
                <View style={styles.subSettingValue}>
                  <Text style={styles.subSettingValueText}>
                    {formatTime(notificationSettings.weeklyMealPrepTime)}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
              
              {showTimePicker && (
                <View style={styles.optionsList}>
                  {TIME_OPTIONS.map(time => (
                    <TouchableOpacity
                      key={time.value}
                      style={[
                        styles.optionItem,
                        notificationSettings.weeklyMealPrepTime === time.value && styles.optionItemActive
                      ]}
                      onPress={() => handleTimeChange(time.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.optionText,
                        notificationSettings.weeklyMealPrepTime === time.value && styles.optionTextActive
                      ]}>
                        {time.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Expiration Alerts</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Snowflake size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Freezer Meal Expiration</Text>
                <Text style={styles.settingDescription}>Alert when freezer meals expire soon</Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.freezerMealExpiration}
              onValueChange={(value) => handleToggle('freezerMealExpiration', value)}
              trackColor={{ false: colors.border, true: '#10b981' }}
              thumbColor={notificationSettings.freezerMealExpiration ? '#fff' : colors.textTertiary}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Package size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Low Pantry Staples</Text>
                <Text style={styles.settingDescription}>Alert when staples are running low</Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.lowPantryStaples}
              onValueChange={(value) => handleToggle('lowPantryStaples', value)}
              trackColor={{ false: colors.border, true: '#10b981' }}
              thumbColor={notificationSettings.lowPantryStaples ? '#fff' : colors.textTertiary}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Reminders</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Meal Reminders</Text>
                <Text style={styles.settingDescription}>Remind about today's planned meals</Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.mealReminders}
              onValueChange={(value) => handleToggle('mealReminders', value)}
              trackColor={{ false: colors.border, true: '#10b981' }}
              thumbColor={notificationSettings.mealReminders ? '#fff' : colors.textTertiary}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <ShoppingBag size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Shopping List</Text>
                <Text style={styles.settingDescription}>Remind to check shopping list</Text>
              </View>
            </View>
            <Switch
              value={notificationSettings.shoppingListReminder}
              onValueChange={(value) => handleToggle('shoppingListReminder', value)}
              trackColor={{ false: colors.border, true: '#10b981' }}
              thumbColor={notificationSettings.shoppingListReminder ? '#fff' : colors.textTertiary}
            />
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Bell size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Notifications will be sent based on your preferences. Make sure notifications are enabled in your device settings.
          </Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
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
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  subSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginLeft: 44,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subSettingLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  subSettingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subSettingValueText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  optionsList: {
    marginLeft: 44,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionItemActive: {
    backgroundColor: '#10b98110',
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  optionTextActive: {
    color: '#10b981',
    fontWeight: '600' as const,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
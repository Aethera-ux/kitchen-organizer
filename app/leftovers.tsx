import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useState, useMemo } from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useKitchen, Leftover } from '@/contexts/KitchenContext';
import { Plus, X, Salad, Snowflake, Check, AlertCircle, Clock, ChevronRight } from 'lucide-react-native';

type LocationType = 'fridge' | 'freezer';

export default function LeftoversScreen() {
  const { colors, isDark } = useTheme();
  const { leftovers, addLeftover, updateLeftover, deleteLeftover } = useKitchen();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLeftover, setEditingLeftover] = useState<Leftover | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'serving',
    storageLocation: 'fridge' as LocationType,
    daysUntilExpiry: 3,
  });
  
  const today = new Date();
  
  const getExpiryStatus = (leftover: Leftover) => {
    const useByDate = new Date(leftover.useByDate);
    const daysUntilExpiry = Math.ceil((useByDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: '#ef4444', text: 'Expired' };
    if (daysUntilExpiry === 0) return { status: 'today', color: '#f59e0b', text: 'Use Today' };
    if (daysUntilExpiry === 1) return { status: 'tomorrow', color: '#f59e0b', text: 'Use Tomorrow' };
    if (daysUntilExpiry <= 2) return { status: 'soon', color: '#f59e0b', text: `${daysUntilExpiry} days` };
    return { status: 'fresh', color: '#10b981', text: `${daysUntilExpiry} days` };
  };
  
  const sortedLeftovers = useMemo(() => {
    return [...leftovers].sort((a, b) => {
      const aDate = new Date(a.useByDate).getTime();
      const bDate = new Date(b.useByDate).getTime();
      return aDate - bDate;
    });
  }, [leftovers]);
  
  const fridgeLeftovers = sortedLeftovers.filter(l => l.storageLocation === 'fridge');
  const freezerLeftovers = sortedLeftovers.filter(l => l.storageLocation === 'freezer');
  
  const openAddModal = () => {
    setEditingLeftover(null);
    setFormData({
      name: '',
      quantity: '1',
      unit: 'serving',
      storageLocation: 'fridge',
      daysUntilExpiry: 3,
    });
    setModalVisible(true);
  };
  
  const openEditModal = (leftover: Leftover) => {
    setEditingLeftover(leftover);
    setFormData({
      name: leftover.name,
      quantity: leftover.quantity.toString(),
      unit: leftover.unit,
      storageLocation: leftover.storageLocation,
      daysUntilExpiry: 3,
    });
    setModalVisible(true);
  };
  
  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    const dateStored = editingLeftover ? editingLeftover.dateStored : new Date().toISOString();
    const useByDate = new Date();
    useByDate.setDate(useByDate.getDate() + formData.daysUntilExpiry);
    
    const leftoverData = {
      name: formData.name.trim(),
      quantity: parseFloat(formData.quantity) || 1,
      unit: formData.unit,
      storageLocation: formData.storageLocation,
      dateStored,
      useByDate: useByDate.toISOString(),
    };
    
    if (editingLeftover) {
      updateLeftover(editingLeftover.id, leftoverData);
    } else {
      addLeftover(leftoverData);
    }
    
    setModalVisible(false);
  };
  
  const markAsUsed = (leftover: Leftover) => {
    deleteLeftover(leftover.id);
  };
  
  const styles = createStyles(colors, isDark);
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Leftovers Tracking',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={openAddModal} style={styles.headerButton}>
              <Plus size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {fridgeLeftovers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Salad size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Fridge ({fridgeLeftovers.length})</Text>
            </View>
            
            {fridgeLeftovers.map(leftover => {
              const expiry = getExpiryStatus(leftover);
              return (
                <TouchableOpacity
                  key={leftover.id}
                  style={styles.leftoverCard}
                  onPress={() => openEditModal(leftover)}
                  activeOpacity={0.7}
                >
                  <View style={styles.leftoverHeader}>
                    <View style={styles.leftoverInfo}>
                      <Text style={styles.leftoverName}>{leftover.name}</Text>
                      <Text style={styles.leftoverQuantity}>
                        {leftover.quantity} {leftover.unit}
                      </Text>
                    </View>
                    <View style={[styles.expiryBadge, { backgroundColor: expiry.color + '20' }]}>
                      <Text style={[styles.expiryText, { color: expiry.color }]}>
                        {expiry.text}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.leftoverFooter}>
                    <View style={styles.dateInfo}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.dateText}>
                        Stored {new Date(leftover.dateStored).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.useButton}
                      onPress={() => markAsUsed(leftover)}
                    >
                      <Check size={16} color="#10b981" />
                      <Text style={styles.useButtonText}>Used</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        {freezerLeftovers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Snowflake size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Freezer ({freezerLeftovers.length})</Text>
            </View>
            
            {freezerLeftovers.map(leftover => {
              const expiry = getExpiryStatus(leftover);
              return (
                <TouchableOpacity
                  key={leftover.id}
                  style={styles.leftoverCard}
                  onPress={() => openEditModal(leftover)}
                  activeOpacity={0.7}
                >
                  <View style={styles.leftoverHeader}>
                    <View style={styles.leftoverInfo}>
                      <Text style={styles.leftoverName}>{leftover.name}</Text>
                      <Text style={styles.leftoverQuantity}>
                        {leftover.quantity} {leftover.unit}
                      </Text>
                    </View>
                    <View style={[styles.expiryBadge, { backgroundColor: expiry.color + '20' }]}>
                      <Text style={[styles.expiryText, { color: expiry.color }]}>
                        {expiry.text}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.leftoverFooter}>
                    <View style={styles.dateInfo}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.dateText}>
                        Stored {new Date(leftover.dateStored).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.useButton}
                      onPress={() => markAsUsed(leftover)}
                    >
                      <Check size={16} color="#10b981" />
                      <Text style={styles.useButtonText}>Used</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        {leftovers.length === 0 && (
          <View style={styles.emptyState}>
            <Salad size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Leftovers</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to track leftovers</Text>
          </View>
        )}
      </ScrollView>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLeftover ? 'Edit Leftover' : 'Add Leftover'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Chicken Stir Fry"
                placeholderTextColor={colors.placeholderText}
              />
              
              <View style={styles.row}>
                <View style={styles.halfColumn}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                    keyboardType="decimal-pad"
                    placeholder="1"
                    placeholderTextColor={colors.placeholderText}
                  />
                </View>
                
                <View style={styles.halfColumn}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.unit}
                    onChangeText={(text) => setFormData({ ...formData, unit: text })}
                    placeholder="serving"
                    placeholderTextColor={colors.placeholderText}
                  />
                </View>
              </View>
              
              <Text style={styles.label}>Storage Location</Text>
              <View style={styles.locationButtons}>
                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    formData.storageLocation === 'fridge' && styles.locationButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, storageLocation: 'fridge' })}
                >
                  <Salad size={20} color={formData.storageLocation === 'fridge' ? '#10b981' : colors.textSecondary} />
                  <Text style={[
                    styles.locationButtonText,
                    formData.storageLocation === 'fridge' && styles.locationButtonTextActive
                  ]}>Fridge</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    formData.storageLocation === 'freezer' && styles.locationButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, storageLocation: 'freezer' })}
                >
                  <Snowflake size={20} color={formData.storageLocation === 'freezer' ? '#3b82f6' : colors.textSecondary} />
                  <Text style={[
                    styles.locationButtonText,
                    formData.storageLocation === 'freezer' && styles.locationButtonTextActive
                  ]}>Freezer</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>Use Within (days)</Text>
              <View style={styles.daysButtons}>
                {[1, 2, 3, 5, 7, 14].map(days => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dayButton,
                      formData.daysUntilExpiry === days && styles.dayButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, daysUntilExpiry: days })}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      formData.daysUntilExpiry === days && styles.dayButtonTextActive
                    ]}>{days}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  leftoverCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leftoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftoverInfo: {
    flex: 1,
  },
  leftoverName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  leftoverQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  expiryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  leftoverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#10b98120',
  },
  useButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#10b981',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#10b98110',
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  locationButtonTextActive: {
    color: colors.text,
    fontWeight: '600' as const,
  },
  daysButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#10b98110',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  dayButtonTextActive: {
    color: '#10b981',
    fontWeight: '600' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
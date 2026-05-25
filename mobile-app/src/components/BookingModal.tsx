import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, IconButton, Surface, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Colors } from '../theme/colors';
import { mss } from '../styles/mss';
import { Calendar, X, CheckCircle, Moon, Clock, Utensils, Users, ArrowRight, ArrowLeft, ShieldCheck, Car, Smartphone, Plus, Trash2, Info } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useServicePricing } from '../hooks/useServicePricing';

const { width } = Dimensions.get('window');

const bookingSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Valid phone number is required'),
  paxAdults: z.number().min(1, 'At least 1 adult is required'),
  paxTeens: z.number().min(0),
  paxChildren: z.number().min(0),
  paxInfants: z.number().min(0),
  checkIn: z.string().min(1, 'Start Date is required'),
  checkOut: z.string().min(1, 'End Date is required'),
  roomType: z.string().optional(),
  mealPreference: z.string().optional(),
  addons: z.array(z.string()).optional(),
  specialRequirements: z.string().optional(),
  /* PREVIOUS ADDONS PRESERVED AS COMMENT PER USER RULES:
  addons: z.array(z.string()).default([]),
  */
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  visible: boolean;
  onDismiss: () => void;
  service: {
    id: string;
    name: string;
    price: number;
    childPrice?: number;
    category?: string;
    meal_plans?: { id: string; label: string; price: number }[];
    room_types?: any[];
  };
  onSubmit: (data: BookingFormData & { totalAmount: number }) => Promise<void>;
  initialData?: Partial<BookingFormData>;
}

// Mock Addons for Parity (Transfers, Spa, etc.)
const AVAILABLE_ADDONS = [
  { id: 'airport_transfer', name: 'Airport Transfer', price: 2500, icon: Car, description: 'Private VIP pickup from SSR Airport' },
  { id: 'sim_card', name: 'Local SIM Card', price: 500, icon: Smartphone, description: '100GB 5G Data pre-activated' },
  { id: 'spa_voucher', name: 'Premium Spa', price: 3500, icon: Moon, description: '60-min Holistic Mauritian Massage' },
  { id: 'early_checkin', name: 'Early Check-in', price: 1500, icon: Clock, description: 'Arrival from 09:00 (Subject to availability)' },
];

export const BookingModal = ({ visible, onDismiss, service, onSubmit, initialData }: BookingModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any>(null);

  const { roomTypes } = useMemo(() => {
    return { roomTypes: service.room_types || [] };
  }, [service]);

  const { control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      paxAdults: initialData?.paxAdults || 2,
      paxTeens: initialData?.paxTeens || 0,
      paxChildren: initialData?.paxChildren || 0,
      paxInfants: initialData?.paxInfants || 0,
      checkIn: initialData?.checkIn || new Date().toISOString().split('T')[0],
      checkOut: initialData?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      roomType: initialData?.roomType || '',
      mealPreference: initialData?.mealPreference || 'none',
      addons: [],
      specialRequirements: '',
    },
  });

  const watchAllFields = watch();
  const selectedRoom = roomTypes.find(r => r.name === watchAllFields.roomType);

  const pricingRequest = useMemo(() => ({
    serviceId: service.id,
    variantId: selectedRoom?.id || 'default',
    startDate: watchAllFields.checkIn,
    endDate: watchAllFields.checkOut,
    participants: {
      adults: watchAllFields.paxAdults,
      teens: watchAllFields.paxTeens,
      children: watchAllFields.paxChildren,
      infants: watchAllFields.paxInfants
    },
    baseRates: {
      adult: selectedRoom?.weekday_price || service.price || 0,
      teen: (service as any).price_teen || service.price * 0.7 || 0,
      child: (service as any).price_child || service.childPrice || service.price * 0.5 || 0,
      infant: (service as any).price_infant || 0
    },
    isPerNight: service.category === 'hotel'
  }), [service, watchAllFields, selectedRoom]);

  const { pricing, mealOptions, loading: calculatingPrice } = useServicePricing(pricingRequest);

  const calculateTotal = () => {
    let base = pricing?.total || 0;
    
    // Dynamic Meal Plan Supplements Integration
    const selectedMealOption = mealOptions.find(m => m.label === watchAllFields.mealPreference);
    const mealPlanTotal = selectedMealOption?.total || 0;

    // Addons
    const currentAddons = watchAllFields.addons || [];
    const addonTotal = currentAddons.reduce((sum, id) => {
      const addon = AVAILABLE_ADDONS.find(a => a.id === id);
      return sum + (addon?.price || 0);
    }, 0);
    /* PREVIOUS ADDONS REDUCE PRESERVED AS COMMENT PER USER RULES:
    const addonTotal = watchAllFields.addons.reduce((sum, id) => {
      const addon = AVAILABLE_ADDONS.find(a => a.id === id);
      return sum + (addon?.price || 0);
    }, 0);
    */

    return base + mealPlanTotal + addonTotal;
  };

  /* PREVIOUS IMPLEMENTATION PRESERVED AS COMMENTS PER USER RULES:
  const { pricing, loading: calculatingPrice } = useServicePricing(pricingRequest);

  const calculateTotal = () => {
    let base = pricing?.total || 0;
    
    // Addons
    const addonTotal = watchAllFields.addons.reduce((sum, id) => {
      const addon = AVAILABLE_ADDONS.find(a => a.id === id);
      return sum + (addon?.price || 0);
    }, 0);

    return base + addonTotal;
  };
  */

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onConfirm = async (data: any) => {
    const formData = data as BookingFormData;
    setIsSubmitting(true);
    try {
      const total = calculateTotal();
      await onSubmit({ ...formData, totalAmount: total });
      setSubmittedReport({ ...formData, totalAmount: total });
      setIsSuccess(true);
    } catch (err) {
      Alert.alert('Booking Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  /* PREVIOUS ONCONFIRM PRESERVED AS COMMENT PER USER RULES:
  const onConfirm = async (data: BookingFormData) => {
    setIsSubmitting(true);
    try {
      const total = calculateTotal();
      await onSubmit({ ...data, totalAmount: total });
      setSubmittedReport({ ...data, totalAmount: total });
      setIsSuccess(true);
    } catch (err) {
      Alert.alert('Booking Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(step => (
        <View key={step} style={styles.stepDotContainer}>
          <View style={[styles.stepDot, currentStep >= step && styles.stepDotActive]} />
          {step < 4 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Journey Details</Text>
      <Text style={styles.stepSub}>Select travel dates and traveler counts.</Text>

      <Surface style={styles.card}>
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => setShowCheckInPicker(true)} style={styles.dateField}>
            <Text style={styles.dateLabel}>DEPARTURE</Text>
            <View style={styles.dateValueContainer}>
              <Calendar size={16} color={Colors.primary} />
              <Text style={styles.dateValue}>{watchAllFields.checkIn}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.dateDivider} />
          <TouchableOpacity onPress={() => setShowCheckOutPicker(true)} style={styles.dateField}>
            <Text style={styles.dateLabel}>RETURN</Text>
            <View style={styles.dateValueContainer}>
              <Calendar size={16} color={Colors.primary} />
              <Text style={styles.dateValue}>{watchAllFields.checkOut}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Surface>

      <Text style={styles.sectionLabel}>TRAVELERS</Text>
      <View style={styles.occupancyGrid}>
        {[
          { label: 'Adults', key: 'paxAdults', min: 1 },
          { label: 'Teens', key: 'paxTeens', min: 0 },
          { label: 'Children', key: 'paxChildren', min: 0 },
          { label: 'Infants', key: 'paxInfants', min: 0 }
        ].map(item => (
          <View key={item.key} style={styles.occupancyItem}>
            <Text style={styles.occLabel}>{item.label}</Text>
            <View style={styles.counterRow}>
              <IconButton 
                icon="minus-circle-outline" 
                size={24} 
                iconColor={Colors.primary}
                onPress={() => setValue(item.key as any, Math.max(item.min, (watchAllFields as any)[item.key] - 1))}
                disabled={(watchAllFields as any)[item.key] <= item.min}
              />
              <Text style={styles.counterText}>{(watchAllFields as any)[item.key]}</Text>
              <IconButton 
                icon="plus-circle-outline" 
                size={24} 
                iconColor={Colors.primary}
                onPress={() => setValue(item.key as any, (watchAllFields as any)[item.key] + 1)}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Stay Options</Text>
      <Text style={styles.stepSub}>Customize your room and dining preferences.</Text>

      {roomTypes.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>ROOM TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomScroll}>
            {roomTypes.map(room => (
              <TouchableOpacity 
                key={room.id}
                onPress={() => setValue('roomType', room.name)}
                style={[styles.roomCard, watchAllFields.roomType === room.name && styles.roomCardActive]}
              >
                <Text style={[styles.roomName, watchAllFields.roomType === room.name && styles.roomTextActive]}>{room.name}</Text>
                <Text style={[styles.roomPrice, watchAllFields.roomType === room.name && styles.roomTextActive]}>
                  MUR {room.weekday_price.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.sectionLabel}>MEAL PLAN</Text>
      <View style={styles.chipGrid}>
        {mealOptions && mealOptions.length > 0 ? (
          mealOptions.map(option => (
            <Chip 
              key={option.label}
              selected={watchAllFields.mealPreference === option.label}
              onPress={() => setValue('mealPreference', option.label)}
              style={[styles.planChip, watchAllFields.mealPreference === option.label && styles.planChipActive]}
              textStyle={[styles.planChipText, watchAllFields.mealPreference === option.label && styles.planChipTextActive]}
            >
              {option.label} (+MUR {option.total.toLocaleString()})
            </Chip>
          ))
        ) : (
          ['none', 'Bed & Breakfast', 'Half Board', 'Full Board', 'All Inclusive'].map(plan => (
            <Chip 
              key={plan}
              selected={watchAllFields.mealPreference === plan}
              onPress={() => setValue('mealPreference', plan)}
              style={[styles.planChip, watchAllFields.mealPreference === plan && styles.planChipActive]}
              textStyle={[styles.planChipText, watchAllFields.mealPreference === plan && styles.planChipTextActive]}
            >
              {plan === 'none' ? 'Room Only' : plan}
            </Chip>
          ))
        )}
      </View>
      {/* PREVIOUS CHIPS PRESERVED AS COMMENTS PER USER RULES:
      <View style={styles.chipGrid}>
        {['none', 'Bed & Breakfast', 'Half Board', 'Full Board', 'All Inclusive'].map(plan => (
          <Chip 
            key={plan}
            selected={watchAllFields.mealPreference === plan}
            onPress={() => setValue('mealPreference', plan)}
            style={[styles.planChip, watchAllFields.mealPreference === plan && styles.planChipActive]}
            textStyle={[styles.planChipText, watchAllFields.mealPreference === plan && styles.planChipTextActive]}
          >
            {plan === 'none' ? 'Room Only' : plan}
          </Chip>
        ))}
      </View>
      */}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Premium Extras</Text>
      <Text style={styles.stepSub}>Select optional addons to enhance your stay.</Text>

      <ScrollView style={styles.addonList}>
        {AVAILABLE_ADDONS.map(addon => {
          const currentAddons = watchAllFields.addons || [];
          const isSelected = currentAddons.includes(addon.id);
          return (
            <TouchableOpacity 
              key={addon.id}
              onPress={() => {
                const current = [...currentAddons];
                if (isSelected) {
                  setValue('addons', current.filter(id => id !== addon.id));
                } else {
                  setValue('addons', [...current, addon.id]);
                }
              }}
              style={[styles.addonCard, isSelected && styles.addonCardActive]}
            >
              <View style={styles.addonIconContainer}>
                <addon.icon size={20} color={isSelected ? '#fff' : Colors.primary} />
              </View>
              <View style={styles.addonInfo}>
                <Text style={[styles.addonName, isSelected && styles.textWhite]}>{addon.name}</Text>
                <Text style={[styles.addonDesc, isSelected && styles.textWhite70]}>{addon.description}</Text>
              </View>
              <Text style={[styles.addonPrice, isSelected && styles.textWhite]}>+Rs {addon.price}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirmation</Text>
      <Text style={styles.stepSub}>Provide contact details for your elite quote.</Text>

      <View style={styles.formGrid}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput label="First Name" mode="outlined" onBlur={onBlur} onChangeText={onChange} value={value} error={!!errors.firstName} style={styles.input} activeOutlineColor={Colors.primary} />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput label="Last Name" mode="outlined" onBlur={onBlur} onChangeText={onChange} value={value} error={!!errors.lastName} style={styles.input} activeOutlineColor={Colors.primary} />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput label="Email Address" mode="outlined" keyboardType="email-address" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} error={!!errors.email} style={styles.input} activeOutlineColor={Colors.primary} />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput label="WhatsApp Number" mode="outlined" keyboardType="phone-pad" onBlur={onBlur} onChangeText={onChange} value={value} error={!!errors.phone} style={styles.input} activeOutlineColor={Colors.primary} />
          )}
        />
      </View>

      <Surface style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <ShieldCheck size={16} color={Colors.success} />
          <Text style={styles.summaryText}>Secure Booking Protocol</Text>
        </View>
        <Text style={styles.summaryNote}>Your request will be handled by a dedicated concierge for final verification.</Text>
      </Surface>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successWrapper}>
      <CheckCircle size={80} color={Colors.success} style={{ marginBottom: 20 }} />
      <Text style={styles.successTitle}>Request Dispatched</Text>
      <Text style={styles.successSub}>Thank you for choosing Travel Lounge Elite. Our concierge team will reach out shortly.</Text>
      
      <Surface style={styles.reportCard}>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>SERVICE</Text>
          <Text style={styles.reportValue}>{service.name}</Text>
        </View>
        <View style={styles.reportRow}>
          <Text style={styles.reportLabel}>ESTIMATED TOTAL</Text>
          <Text style={styles.reportValue}>MUR {calculateTotal().toLocaleString()}</Text>
        </View>
      </Surface>

      <Button mode="contained" onPress={onDismiss} style={styles.doneBtn} contentStyle={{ height: 50 }} buttonColor={Colors.charcoal}>
        BACK TO EXPLORE
      </Button>
    </View>
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        {isSuccess ? renderSuccess() : (
          <View style={styles.content}>
            <View style={styles.header}>
              <View>
                <Text style={styles.brandBadge}>ELITE CONCIERGE</Text>
                <Text style={styles.title}>{service.name}</Text>
              </View>
              <IconButton icon="close" onPress={onDismiss} />
            </View>

            {renderStepIndicator()}

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.priceContainer}>
                <View>
                   <Text style={styles.priceLabel}>ESTIMATED QUOTE</Text>
                   <Text style={styles.nightsText}>{pricing?.nights || 0} NIGHTS SELECTION</Text>
                </View>
                {calculatingPrice ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.totalPrice}>Rs {calculateTotal().toLocaleString()}</Text>
                )}
              </View>

              <View style={styles.buttonRow}>
                {currentStep > 1 && (
                  <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <ArrowLeft size={20} color={Colors.charcoal} />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  onPress={currentStep === 4 ? () => (handleSubmit as any)(onConfirm)() : handleNext}
                  disabled={isSubmitting || (currentStep === 1 && pricing?.availabilityStatus?.isAvailable === false)}
                  style={[styles.nextBtn, currentStep === 1 ? { flex: 1 } : {}]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.nextBtnText}>{currentStep === 4 ? 'SEND REQUEST' : 'CONTINUE'}</Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {showCheckInPicker && (
          <DateTimePicker
            value={new Date(watchAllFields.checkIn)}
            mode="date"
            onChange={(event, date) => {
              setShowCheckInPicker(false);
              if (date) setValue('checkIn', date.toISOString().split('T')[0]);
            }}
          />
        )}
        {showCheckOutPicker && (
          <DateTimePicker
            value={new Date(watchAllFields.checkOut)}
            mode="date"
            onChange={(event, date) => {
              setShowCheckOutPicker(false);
              if (date) setValue('checkOut', date.toISOString().split('T')[0]);
            }}
          />
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    margin: 0,
    marginTop: 40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.charcoal,
    maxWidth: width * 0.7,
  },
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    justifyContent: 'center',
  },
  stepDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#eee',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.charcoal,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 13,
    color: Colors.slate[500],
    lineHeight: 18,
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    padding: 20,
    marginBottom: 24,
    elevation: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.slate[400],
    marginBottom: 8,
    letterSpacing: 1,
  },
  dateValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.charcoal,
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.charcoal,
    letterSpacing: 1.5,
    marginBottom: 16,
    marginTop: 8,
  },
  occupancyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  occupancyItem: {
    width: (width - 60) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
  },
  occLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate[500],
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.charcoal,
  },
  roomScroll: {
    marginBottom: 24,
  },
  roomCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    marginRight: 12,
    minWidth: 160,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roomCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 4,
  },
  roomPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate[500],
  },
  roomTextActive: {
    color: '#fff',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  planChip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  planChipActive: {
    backgroundColor: Colors.charcoal,
  },
  planChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[500],
  },
  planChipTextActive: {
    color: '#fff',
  },
  addonList: {
    marginBottom: 20,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addonCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  addonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 2,
  },
  addonDesc: {
    fontSize: 11,
    color: Colors.slate[500],
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  textWhite: { color: '#fff' },
  textWhite70: { color: 'rgba(255,255,255,0.7)' },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  summaryCard: {
    marginTop: 10,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryNote: {
    fontSize: 11,
    color: '#15803D',
    lineHeight: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.slate[400],
    letterSpacing: 1,
  },
  nightsText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.charcoal,
    letterSpacing: -0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 3,
    height: 56,
    backgroundColor: Colors.charcoal,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  successWrapper: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    color: Colors.slate[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  reportCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
  },
  reportRow: {
    marginBottom: 16,
  },
  reportLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.slate[400],
    letterSpacing: 1,
    marginBottom: 4,
  },
  reportValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.charcoal,
  },
  doneBtn: {
    width: '100%',
    borderRadius: 16,
  },
  formGrid: {
    marginTop: 10,
  }
});

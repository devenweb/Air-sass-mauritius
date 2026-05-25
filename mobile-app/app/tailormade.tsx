import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, TextInput as NativeTextInput } from 'react-native';
import { Text, TextInput, Button, Checkbox, Surface, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { CheckCircle, Plus, Minus, ArrowLeft, Send } from 'lucide-react-native';
import { supabase } from '../src/lib/supabase';
import { useSettings } from '../src/context/SettingsContext';
import { resolveImageUrl } from '../src/utils/imageUtils';
import { StatusBar } from 'expo-status-bar';

export default function TailorMadeScreen() {
  const router = useRouter();
  const { generalConfig } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    destination: '',
    departureDate: '',
    flexibility: '',
    nights: '',
    message: '',
    marketingOptIn: false,
    termsAgreed: false,
  });

  const [adultsCount, setAdultsCount] = useState(2);
  const [childAges, setChildAges] = useState<string[]>([]);

  const handleAgeChange = (index: number, age: string) => {
    const newAges = [...childAges];
    newAges[index] = age;
    setChildAges(newAges);
  };

  const addChild = () => {
    if (childAges.length < 10) {
      setChildAges([...childAges, '']);
    }
  };

  const removeChild = (index: number) => {
    setChildAges(childAges.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const sanitizeString = (str: string) => str.replace(/<[^>]*>?/gm, '').trim();

    if (!sanitizeString(formData.firstName) || !sanitizeString(formData.lastName) || !sanitizeString(formData.email) || !sanitizeString(formData.phone) || !sanitizeString(formData.destination)) {
      Alert.alert('Required Fields', 'Please fill in all mandatory fields with valid information.');
      return;
    }

    if (!formData.termsAgreed) {
      Alert.alert('Terms', 'Please agree to the Terms & Privacy Policy.');
      return;
    }

    setIsSubmitting(true);

    const fullMessage = `
Full Name: ${formData.firstName} ${formData.lastName}
Phone: ${formData.phone}
Departure Date: ${formData.departureDate}
Flexibility: ${formData.flexibility}
Nights: ${formData.nights}
Country: ${formData.destination}
Adults: ${adultsCount}
Children: ${childAges.length}
Child Ages: ${childAges.join(', ')}

Additional Information:
${formData.message}

Agreed to Terms: Yes
Marketing Opt-in: ${formData.marketingOptIn ? 'Yes' : 'No'}
    `.trim();

    try {
      // 1. Save Inquiry
      const { error: inquiryError } = await supabase.from('inquiries').insert([{
        name: `${sanitizeString(formData.firstName)} ${sanitizeString(formData.lastName)}`,
        email: sanitizeString(formData.email),
        phone: sanitizeString(formData.phone),
        subject: `Tailor-Made Request: ${sanitizeString(formData.destination) || 'Custom'}`,
        message: sanitizeString(fullMessage),
        status: 'unread'
      }]);

      if (inquiryError) throw inquiryError;

      // 2. Marketing Logic
      if (formData.marketingOptIn) {
        await supabase.from('customers').upsert({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          is_subscriber: true,
          status: 'Active'
        }, { onConflict: 'email' });
        
        await supabase.from('subscribers').upsert({
            email: formData.email,
            status: 'active'
        }, { onConflict: 'email' });
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.back();
      }, 3000);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.successRoot}>
        <StatusBar style="dark" />
        <CheckCircle color="#059669" size={80} />
        <Text style={styles.successTitle}>REQUEST SENT!</Text>
        <Text style={styles.successText}>Our travel designers will contact you shortly to start planning your dream journey.</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backBtn}>Return Home</Button>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack.Screen options={{ 
        headerShown: true,
        headerTitle: "Tailor-Made Package",
        headerTitleStyle: { fontFamily: 'Outfit_900Black', fontSize: 16 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
            <ArrowLeft size={24} color={Colors.charcoal} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Step 1: Personal Details */}
        <Surface style={styles.card} elevation={0}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>1</Text></View>
            <Text style={styles.stepTitle}>Personal Details</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>First Name</Text>
              <NativeTextInput 
                placeholder="John" 
                style={styles.nativeInput} 
                value={formData.firstName}
                onChangeText={(t) => setFormData({...formData, firstName: t})}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <NativeTextInput 
                placeholder="Doe" 
                style={styles.nativeInput}
                value={formData.lastName}
                onChangeText={(t) => setFormData({...formData, lastName: t})}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <NativeTextInput 
              placeholder="john@example.com" 
              keyboardType="email-address" 
              autoCapitalize="none"
              style={styles.nativeInput}
              value={formData.email}
              onChangeText={(t) => setFormData({...formData, email: t})}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <NativeTextInput 
              placeholder="+230 5..." 
              keyboardType="phone-pad"
              style={styles.nativeInput}
              value={formData.phone}
              onChangeText={(t) => setFormData({...formData, phone: t})}
            />
          </View>
        </Surface>

        {/* Step 2: Trip Details */}
        <Surface style={styles.card} elevation={0}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>2</Text></View>
            <Text style={styles.stepTitle}>Trip Details</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Where to?</Text>
            <NativeTextInput 
              placeholder="Destination country..." 
              style={styles.nativeInput}
              value={formData.destination}
              onChangeText={(t) => setFormData({...formData, destination: t})}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
               <Text style={styles.inputLabel}>Star Date</Text>
               <NativeTextInput 
                placeholder="DD/MM/YYYY" 
                style={styles.nativeInput}
                value={formData.departureDate}
                onChangeText={(t) => setFormData({...formData, departureDate: t})}
              />
            </View>
            <View style={styles.col}>
               <Text style={styles.inputLabel}>Nights</Text>
               <NativeTextInput 
                placeholder="e.g. 7" 
                keyboardType="numeric"
                style={styles.nativeInput}
                value={formData.nights}
                onChangeText={(t) => setFormData({...formData, nights: t})}
              />
            </View>
          </View>
        </Surface>

        {/* Step 3: Guests */}
        <Surface style={styles.card} elevation={0}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>3</Text></View>
            <Text style={styles.stepTitle}>How many guests?</Text>
          </View>

          <View style={styles.guestControl}>
              <View>
                <Text style={styles.guestMainLabel}>ADULTS</Text>
                <Text style={styles.guestSubLabel}>AGE 18+</Text>
              </View>
              <View style={styles.counterRow}>
                <IconButton icon="minus-circle-outline" size={28} iconColor={Colors.primary} disabled={adultsCount <= 1} onPress={() => setAdultsCount(Math.max(1, adultsCount - 1))} />
                <Text style={styles.counterText}>{adultsCount}</Text>
                <IconButton icon="plus-circle-outline" size={28} iconColor={Colors.primary} onPress={() => setAdultsCount(adultsCount + 1)} />
              </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.childSection}>
            <View style={styles.childHeader}>
              <View>
                <Text style={styles.guestMainLabel}>CHILDREN</Text>
                <Text style={styles.guestSubLabel}>AGE 0-17</Text>
              </View>
              <TouchableOpacity style={styles.addChildBtn} onPress={addChild}>
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.addChildText}>ADD CHILD</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.childAgesGrid}>
              {childAges.map((age, idx) => (
                <View key={idx} style={styles.ageBadge}>
                   <Text style={styles.ageBadgeIdx}>{idx+1}</Text>
                   <NativeTextInput 
                    placeholder="Age" 
                    keyboardType="numeric" 
                    value={age}
                    onChangeText={(t) => handleAgeChange(idx, t)}
                    style={styles.ageInput}
                   />
                   <TouchableOpacity onPress={() => removeChild(idx)}><Minus size={14} color={Colors.slate[400]} /></TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </Surface>

        {/* Step 4: Requests */}
        <Surface style={styles.card} elevation={0}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNumber}>4</Text></View>
            <Text style={styles.stepTitle}>Special Requests</Text>
          </View>
          <NativeTextInput 
            placeholder="Preferred hotel standards, specific activities, or any special requirements..."
            style={[styles.nativeInput, styles.textArea]}
            multiline
            numberOfLines={4}
            value={formData.message}
            onChangeText={(t) => setFormData({...formData, message: t})}
          />
        </Surface>

        {/* Consents */}
        <View style={styles.consentSection}>
          <TouchableOpacity 
            style={styles.consentItem} 
            onPress={() => setFormData({...formData, termsAgreed: !formData.termsAgreed})}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, formData.termsAgreed && styles.checkboxActive]}>
              {formData.termsAgreed && <CheckCircle size={14} color={Colors.white} />}
            </View>
            <Text style={styles.consentText}>I agree to the Terms & Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.consentItem} 
            onPress={() => setFormData({...formData, marketingOptIn: !formData.marketingOptIn})}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, formData.marketingOptIn && styles.checkboxActive]}>
              {formData.marketingOptIn && <CheckCircle size={14} color={Colors.white} />}
            </View>
            <Text style={styles.consentText}>Receive travel offers by email</Text>
          </TouchableOpacity>
        </View>

        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submitBtn}
          contentStyle={styles.submitBtnContent}
          labelStyle={styles.submitBtnLabel}
        >
          SUBMIT REQUEST
        </Button>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 32, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  stepBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumber: { color: Colors.white, fontFamily: 'Outfit_900Black', fontSize: 14 },
  stepTitle: { fontFamily: 'Outfit_900Black', fontSize: 18, color: Colors.charcoal, letterSpacing: -0.5 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  col: { flex: 1 },
  fieldGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 10, fontFamily: 'Outfit_900Black', color: Colors.slate[400], textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, paddingLeft: 4 },
  nativeInput: { 
    backgroundColor: '#F1F5F9', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    fontFamily: 'Outfit_600SemiBold', 
    fontSize: 14, 
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  guestControl: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guestMainLabel: { fontFamily: 'Outfit_900Black', fontSize: 14, color: Colors.charcoal },
  guestSubLabel: { fontFamily: 'Outfit_900Black', fontSize: 9, color: Colors.slate[400], letterSpacing: 1 },
  counterRow: { flexDirection: 'row', alignItems: 'center' },
  counterText: { fontFamily: 'Outfit_900Black', fontSize: 18, color: Colors.charcoal, width: 30, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  childSection: {},
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addChildBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
  addChildText: { fontFamily: 'Outfit_900Black', fontSize: 10, color: Colors.primary, letterSpacing: 1 },
  childAgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ageBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  ageBadgeIdx: { width: 18, height: 18, borderRadius: 4, backgroundColor: Colors.white, textAlign: 'center', fontSize: 10, fontFamily: 'Outfit_900Black', color: Colors.primary },
  ageInput: { width: 30, textAlign: 'center', fontFamily: 'Outfit_900Black', fontSize: 12, color: Colors.charcoal },
  consentSection: { paddingHorizontal: 10, gap: 12, marginBottom: 24 },
  consentItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  consentText: { fontFamily: 'Outfit_700Bold', fontSize: 11, color: Colors.slate[400], textTransform: 'uppercase', letterSpacing: 1 },
  submitBtn: { borderRadius: 16, backgroundColor: Colors.charcoal },
  submitBtnContent: { height: 64 },
  submitBtnLabel: { fontFamily: 'Outfit_900Black', fontSize: 14, letterSpacing: 2 },
  successRoot: { flex: 1, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successTitle: { fontFamily: 'Outfit_900Black', fontSize: 28, color: Colors.charcoal, marginTop: 24, marginBottom: 12 },
  successText: { fontFamily: 'Outfit_500Medium', fontSize: 16, color: Colors.slate[400], textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  backBtn: { width: '100%', borderRadius: 16 },
});

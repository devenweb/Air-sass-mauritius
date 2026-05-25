import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Text, Button, Portal, Surface, Chip } from 'react-native-paper';
import { Colors } from '../theme/colors';
import { X, Search, Users, Shield, Zap } from 'lucide-react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: any;
  onApply: (filters: any) => void;
  availableAmenities?: string[];
}

export const FilterModal = ({ visible, onClose, filters, onApply, availableAmenities = [] }: FilterModalProps) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [amenitySearch, setAmenitySearch] = useState('');

  const updateFilter = (key: string, value: any) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const toggleAmenity = (amenity: string) => {
    const current = localFilters.amenities || [];
    if (current.includes(amenity)) {
      updateFilter('amenities', current.filter((a: string) => a !== amenity));
    } else {
      updateFilter('amenities', [...current, amenity]);
    }
  };

  const resetFilters = () => {
    setLocalFilters({
      adults: 2,
      teenagers: 0,
      children: 0,
      infants: 0,
      date: null,
      priceRange: [0, 200000],
      amenities: [],
    });
  };

  const filteredAmenities = useMemo(() => {
    if (!amenitySearch) return availableAmenities.slice(0, 15);
    return availableAmenities.filter(a => 
      a.toLowerCase().includes(amenitySearch.toLowerCase())
    ).slice(0, 20);
  }, [availableAmenities, amenitySearch]);

  return (
    <Portal>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent} elevation={5}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Filter Search</Text>
                <Text style={styles.headerSub}>Refine your perfect getaway</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color={Colors.charcoal} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              
              {/* Guests Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                   <Users size={18} color={Colors.primary} />
                   <Text style={styles.sectionTitle}>Guests & Occupancy</Text>
                </View>
                
                <View style={styles.guestRow}>
                  <View>
                    <Text style={styles.guestLabel}>Adults</Text>
                    <Text style={styles.guestSub}>Ages 18+</Text>
                  </View>
                  <View style={styles.counter}>
                    <TouchableOpacity 
                      style={[styles.counterBtn, localFilters.adults <= 1 && styles.counterBtnDisabled]} 
                      disabled={localFilters.adults <= 1} 
                      onPress={() => updateFilter('adults', localFilters.adults - 1)}
                    >
                       <Text style={styles.counterBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{localFilters.adults}</Text>
                    <TouchableOpacity 
                      style={styles.counterBtn} 
                      onPress={() => updateFilter('adults', localFilters.adults + 1)}
                    >
                       <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.guestRow}>
                  <View>
                    <Text style={styles.guestLabel}>Teenagers</Text>
                    <Text style={styles.guestSub}>Ages 12-17</Text>
                  </View>
                  <View style={styles.counter}>
                    <TouchableOpacity 
                      style={[styles.counterBtn, localFilters.teenagers <= 0 && styles.counterBtnDisabled]} 
                      disabled={localFilters.teenagers <= 0} 
                      onPress={() => updateFilter('teenagers', localFilters.teenagers - 1)}
                    >
                       <Text style={styles.counterBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{localFilters.teenagers}</Text>
                    <TouchableOpacity 
                      style={styles.counterBtn} 
                      onPress={() => updateFilter('teenagers', localFilters.teenagers + 1)}
                    >
                       <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.guestRow}>
                  <View>
                    <Text style={styles.guestLabel}>Children</Text>
                    <Text style={styles.guestSub}>Ages 3-11</Text>
                  </View>
                  <View style={styles.counter}>
                    <TouchableOpacity 
                      style={[styles.counterBtn, localFilters.children <= 0 && styles.counterBtnDisabled]} 
                      disabled={localFilters.children <= 0} 
                      onPress={() => updateFilter('children', localFilters.children - 1)}
                    >
                       <Text style={styles.counterBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{localFilters.children}</Text>
                    <TouchableOpacity 
                      style={styles.counterBtn} 
                      onPress={() => updateFilter('children', localFilters.children + 1)}
                    >
                       <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Price Range */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                   <Zap size={18} color={Colors.primary} />
                   <Text style={styles.sectionTitle}>Budget Range</Text>
                </View>
                 <Text style={styles.priceValue}>Up to Rs {localFilters.priceRange[1].toLocaleString()}</Text>
                 <View style={styles.pricePresets}>
                    {[5000, 10000, 25000, 50000, 100000, 200000].map(p => (
                      <TouchableOpacity 
                        key={p} 
                        style={[styles.presetBtn, localFilters.priceRange[1] === p && styles.presetBtnActive]}
                        onPress={() => updateFilter('priceRange', [0, p])}
                      >
                        <Text style={[styles.presetText, localFilters.priceRange[1] === p && styles.presetTextActive]}>
                          {p >= 100000 ? `Rs ${p/1000}k+` : `Rs ${p/1000}k`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                 </View>
              </View>

              <View style={styles.divider} />

              {/* Amenities Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                   <Shield size={18} color={Colors.primary} />
                   <Text style={styles.sectionTitle}>Amenities & Features</Text>
                </View>

                <View style={styles.trendingContainer}>
                   <Text style={styles.trendingLabel}>TRENDING NOW</Text>
                   <View style={styles.trendingTags}>
                      {['WiFi', 'Pool', 'Breakfast', 'Spa', 'Beachfront'].map(tag => (
                        <TouchableOpacity 
                          key={tag} 
                          onPress={() => toggleAmenity(tag)}
                          style={[
                            styles.trendingTag,
                            (localFilters.amenities || []).includes(tag) && styles.trendingTagActive
                          ]}
                        >
                          <Text style={[
                            styles.trendingTagText,
                            (localFilters.amenities || []).includes(tag) && styles.trendingTagTextActive
                          ]}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                   </View>
                </View>

                <View style={styles.amenitySearchContainer}>
                  <Search size={16} color={Colors.slate[400]} style={styles.searchIcon} />
                  <TextInput
                    placeholder="Search amenities (e.g. WiFi, Pool)..."
                    style={styles.amenityInput}
                    value={amenitySearch}
                    onChangeText={setAmenitySearch}
                    placeholderTextColor={Colors.slate[400]}
                  />
                </View>

                <View style={styles.amenitiesGrid}>
                  {filteredAmenities.map((amenity) => (
                    <Chip
                      key={amenity}
                      selected={(localFilters.amenities || []).includes(amenity)}
                      onPress={() => toggleAmenity(amenity)}
                      style={[
                        styles.amenityChip,
                        (localFilters.amenities || []).includes(amenity) && styles.amenityChipActive
                      ]}
                      textStyle={[
                        styles.amenityChipText,
                        (localFilters.amenities || []).includes(amenity) && styles.amenityChipTextActive
                      ]}
                      showSelectedOverlay
                    >
                      {amenity}
                    </Chip>
                  ))}
                </View>
              </View>

            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetText}>Reset All</Text>
              </TouchableOpacity>
              <Button 
                mode="contained" 
                onPress={() => onApply(localFilters)} 
                style={styles.applyBtn} 
                contentStyle={styles.applyBtnContent}
                labelStyle={styles.applyBtnLabel}
              >
                Show Results
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: Colors.white, 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    height: '90%', 
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    borderBottomWidth: 1, 
    borderBottomColor: Colors.slate[100] 
  },
  headerTitle: { fontFamily: 'Outfit_900Black', fontSize: 24, color: Colors.charcoal, letterSpacing: -0.5 },
  headerSub: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.slate[400], marginTop: 2 },
  closeBtn: { padding: 8, backgroundColor: Colors.slate[50], borderRadius: 12 },
  scrollBody: { padding: 24 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontFamily: 'Outfit_900Black', fontSize: 16, color: Colors.charcoal, textTransform: 'uppercase', letterSpacing: 1 },
  guestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  guestLabel: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: Colors.charcoal },
  guestSub: { fontFamily: 'Outfit_500Medium', fontSize: 12, color: Colors.slate[400], marginTop: 2 },
  counter: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.slate[50], borderRadius: 16, padding: 4 },
  counterBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  counterBtnDisabled: { opacity: 0.5, backgroundColor: Colors.slate[100] },
  counterBtnText: { fontSize: 20, fontWeight: 'bold', color: Colors.charcoal },
  counterValue: { fontFamily: 'Outfit_900Black', fontSize: 16, color: Colors.charcoal, width: 40, textAlign: 'center' },
  divider: { height: 1, backgroundColor: Colors.slate[100], marginBottom: 32 },
  priceValue: { fontFamily: 'Outfit_900Black', fontSize: 28, color: Colors.primary, marginBottom: 20, letterSpacing: -1 },
  pricePresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: Colors.slate[200], backgroundColor: Colors.white },
  presetBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  presetText: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: Colors.slate[600] },
  presetTextActive: { color: Colors.white },
  amenitySearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.slate[50], borderRadius: 16, paddingHorizontal: 16, height: 50, marginBottom: 16, borderWidth: 1, borderColor: Colors.slate[100] },
  searchIcon: { marginRight: 12 },
  amenityInput: { flex: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.charcoal },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { backgroundColor: Colors.white, borderColor: Colors.slate[200], borderWidth: 1, borderRadius: 12 },
  amenityChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  amenityChipText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: Colors.slate[600] },
  amenityChipTextActive: { color: Colors.white },
  trendingContainer: { marginBottom: 20 },
  trendingLabel: { fontFamily: 'Outfit_900Black', fontSize: 10, color: Colors.slate[400], letterSpacing: 2, marginBottom: 12 },
  trendingTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendingTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: Colors.slate[50], borderWidth: 1, borderColor: Colors.slate[100] },
  trendingTagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  trendingTagText: { fontFamily: 'Outfit_700Bold', fontSize: 11, color: Colors.slate[500] },
  trendingTagTextActive: { color: Colors.white },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderTopWidth: 1, borderTopColor: Colors.slate[100], backgroundColor: Colors.white },
  resetText: { fontFamily: 'Outfit_900Black', fontSize: 13, color: Colors.slate[400], textDecorationLine: 'underline' },
  applyBtn: { flex: 1, marginLeft: 32, borderRadius: 20, backgroundColor: Colors.primary },
  applyBtnContent: { height: 56 },
  applyBtnLabel: { fontFamily: 'Outfit_900Black', fontSize: 15, letterSpacing: 0.5 },
});

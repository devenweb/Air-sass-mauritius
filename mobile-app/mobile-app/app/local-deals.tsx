import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Surface, Searchbar } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../src/theme/colors';
// import { mss } from '../styles/mss';
import { MapPin, Sparkles, Filter, Percent, Info, ArrowLeft, Search, Calendar as CalendarIcon, Users } from 'lucide-react-native';
import { ServiceCard } from '../src/components/ServiceCard';
import { supabase } from '../src/lib/supabase';
import { useSettings } from '../src/context/SettingsContext';
import { resolveImageUrl } from '../src/utils/imageUtils';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 280;

export default function LocalDealsScreen() {
  const router = useRouter();
  const { generalConfig } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLocalDeals();
  }, []);

  const fetchLocalDeals = async () => {
    setIsLoading(true);
    try {
      // Local Deals logic: Filters for resident-specific or Mauritian locations
      // In the web-app, it filters by specific service types and a 'local-deals' slug
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('status', 'active')
        .or('location.ilike.%mauritius%,location.ilike.%resident%')
        .in('category', ['hotel', 'day_package', 'activity', 'land_activity', 'sea_activity'])
        .order('is_seasonal', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching local deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* Elite Hero Header */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1544911845-1f34a3eb46b1?auto=format&fit=crop&q=80&w=1000' }} 
            style={styles.heroImage} 
          />
          <View style={styles.overlay} />
          
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.badgeRow}>
              <View style={styles.localBadge}>
                <MapPin size={10} color="#fff" />
                <Text style={styles.localBadgeText}>RESIDENT EXCLUSIVE</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>LOCAL ISLAND</Text>
            <Text style={styles.heroTitleHighlight}>ESCAPES</Text>
            <Text style={styles.heroSub}>Discover the best resident rates for luxury hotels and island adventures.</Text>
          </View>
        </View>

        {/* Search & Filter Bar (Sticky) */}
        <View style={styles.searchWrapper}>
           <Surface style={styles.searchContainer} elevation={4}>
              <Search 
                size={20} 
                color={Colors.slate[400]} 
                style={{ marginLeft: 16 }} 
              />
              <Searchbar
                placeholder="Search resorts, adventures..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
                placeholderTextColor={Colors.slate[400]}
                iconColor={Colors.slate[400]}
                mode="view"
                showDivider={false}
              />
           </Surface>
        </View>

        {/* Quick Filter Chips */}
        <View style={styles.quickFilters}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
                 <Text style={[styles.filterChipText, styles.filterChipTextActive]}>ALL DEALS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterChip}>
                 <Text style={styles.filterChipText}>HOTELS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterChip}>
                 <Text style={styles.filterChipText}>DAY PACKAGES</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterChip}>
                 <Text style={styles.filterChipText}>ACTIVITIES</Text>
              </TouchableOpacity>
           </ScrollView>
        </View>

        {/* Results Section */}
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
             <Text style={styles.resultsCount}>{filteredServices.length} OFFERS FOUND</Text>
             <TouchableOpacity style={styles.sortBtn}>
                <Filter size={16} color={Colors.primary} />
                <Text style={styles.sortBtnText}>SORT</Text>
             </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loaderText}>Curation local deals...</Text>
            </View>
          ) : filteredServices.length > 0 ? (
            <View style={styles.grid}>
              {filteredServices.map((service) => (
                <View key={service.id} style={styles.cardWrapper}>
                  <ServiceCard 
                    name={service.name} 
                    image_url={service.image_url} 
                    price={service.price || 0}
                    category={service.category} 
                    location={service.location}
                    rating={service.rating}
                    duration={service.duration_days ? `${service.duration_days} Days` : service.duration_hours ? `${service.duration_hours} Hours` : undefined}
                    amenities={service.amenities}
                    meal_plans={service.meal_plans}
                    activity_type={service.activity_type}
                    is_seasonal={service.is_seasonal}
                    deal_note={service.deal_note || 'RESIDENT RATE'}
                    short_description={service.short_description || service.description}
                    onPress={() => router.push(`/services/${service.id}`)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Percent size={48} color={Colors.slate[200]} />
              <Text style={styles.emptyTitle}>No Local Deals Found</Text>
              <Text style={styles.emptySub}>Try adjusting your search criteria.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: Colors.charcoal,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  localBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroTitleHighlight: {
    color: Colors.white,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginTop: -8,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  searchWrapper: {
    marginTop: -32,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 64,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBar: {
    flex: 1,
    backgroundColor: 'transparent',
    elevation: 0,
    height: 60,
  },
  searchInput: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    minHeight: 0,
  },
  quickFilters: {
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  filterScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.slate[50],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.charcoal,
    borderColor: Colors.charcoal,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate[400],
    letterSpacing: 1,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: Colors.slate[50],
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsCount: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.slate[400],
    letterSpacing: 2,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.charcoal,
  },
  grid: {
    gap: 20,
  },
  cardWrapper: {
    width: '100%',
  },
  loader: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate[400],
    letterSpacing: 1,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.charcoal,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.slate[400],
    textAlign: 'center',
  }
});

import React from 'react';
import { useWindowDimensions, Image, TouchableOpacity, View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../../src/theme/colors';
import { useHomeData } from '../../src/hooks/useHomeData';
import { HeroCarousel } from '../../src/components/HeroCarousel';
import { CategoryCard } from '../../src/components/CategoryCard';
import { ServiceCard } from '../../src/components/ServiceCard';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Search, Filter, Plane, Sparkles, Percent, MessageCircle, Mail, MapPin, Calendar as CalendarIcon, Users } from 'lucide-react-native';
import { PremiumCarousel } from '../../src/components/PremiumCarousel';
import { PartnerSlider } from '../../src/components/PartnerSlider';
import Footer from '../../src/components/Footer';
import { useSettings } from '../../src/context/SettingsContext';
import { resolveImageUrl } from '../../src/utils/imageUtils';
import * as Linking from 'expo-linking';
import Animated, { useAnimatedStyle, interpolate, Extrapolate, SharedValue } from 'react-native-reanimated';

const DEST_GAP = 20;

const DestinationCard = ({ item, index, scrollX, onPress, cardWidth }: { 
  item: any; index: number; scrollX: SharedValue<number>; onPress: () => void; cardWidth: number;
}) => {
  const animatedCardStyle = useAnimatedStyle(() => {
    const input = [(index - 1)*(cardWidth+DEST_GAP), index*(cardWidth+DEST_GAP), (index + 1)*(cardWidth+DEST_GAP)];
    return { opacity: interpolate(scrollX.value, input, [0.8, 1, 0.8], Extrapolate.CLAMP) };
  });

  return (
    <Animated.View style={[styles.destCardWrapper, { width: cardWidth, marginRight: DEST_GAP }, animatedCardStyle]}>
      <TouchableOpacity style={styles.destCard} onPress={onPress}>
        <Image source={item.image} style={styles.destImage} />
        <View style={styles.destOverlay}>
           <View style={styles.destLabelWrapper}>
              <Text style={styles.destType}>ESTINATION</Text>
              <Text style={styles.destName}>{item.name}</Text>
           </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const DEST_CARD_WIDTH = width * 0.8;
  
  const { heroSlides, categories, destinations, featuredServices, isLoading } = useHomeData();
  const { mobileConfig, generalConfig, contentBlocks } = useSettings();
  const router = useRouter();

  const handleInquiry = (method: 'whatsapp' | 'email' | 'call') => {
    const contact = {
      phone: mobileConfig?.supportPhone || generalConfig?.contactPhone || '+230 5940 7701',
      email: generalConfig?.contactEmail || 'office@travel-lounge.com'
    };
    if (method === 'whatsapp') Linking.openURL(`https://wa.me/${contact.phone.replace(/\+/g, '')}`);
    if (method === 'email') Linking.openURL(`mailto:${contact.email}`);
    if (method === 'call') Linking.openURL(`tel:${contact.phone}`);
  };

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      
      {/* Executive Header */}
      <View style={styles.header}>
        <Image 
          source={resolveImageUrl(generalConfig?.logoUrl || '/assets/logo.png')} 
          style={[
            styles.logo, 
            generalConfig?.logoHeight ? { height: parseInt(generalConfig.logoHeight) } : null,
            generalConfig?.logoWidth && generalConfig.logoWidth !== 'auto' ? { width: parseInt(generalConfig.logoWidth) } : null
          ]} 
          resizeMode="contain" 
        />
        <View style={styles.headerActions}>
           <TouchableOpacity style={styles.actionBtn} onPress={() => handleInquiry('whatsapp')}>
              <MessageCircle size={18} color={Colors.charcoal} />
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionBtn} onPress={() => handleInquiry('email')}>
              <Mail size={18} color={Colors.charcoal} />
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Dynamic Hero Carousel Restoration (CRITICAL PARITY) */}
        <HeroCarousel data={heroSlides} />

        {/* Core Logic 1: Find Value (Prices/Benefits) */}
        <View style={styles.valuationSection}>
           <View style={styles.searchBarWrapper}>
             <TouchableOpacity style={styles.searchSegment} onPress={() => router.push('/explore')}>
               <MapPin size={18} color={Colors.primary} />
               <View>
                 <Text style={styles.searchLabel}>Where to?</Text>
                 <Text style={styles.searchValue}>Anywhere</Text>
               </View>
             </TouchableOpacity>
             <View style={styles.searchDivider} />
             <TouchableOpacity style={styles.searchSegment} onPress={() => router.push('/explore')}>
               <CalendarIcon size={18} color={Colors.primary} />
               <View>
                 <Text style={styles.searchLabel}>When?</Text>
                 <Text style={styles.searchValue}>Select Date</Text>
               </View>
             </TouchableOpacity>
             <View style={styles.searchDivider} />
             <TouchableOpacity style={styles.searchSegment} onPress={() => router.push('/explore')}>
               <Users size={18} color={Colors.primary} />
               <View>
                 <Text style={styles.searchLabel}>Guests</Text>
                 <Text style={styles.searchValue}>Add</Text>
               </View>
             </TouchableOpacity>
           </View>

           <View style={styles.servicesHeader}>
              <Text style={styles.labelTitle}>OUR SERVICES</Text>
              <Text style={[styles.sectionTitle, { fontSize: 32 }]}>Helping You Plan{"\n"}<Text style={{color: Colors.slate[300]}}>Perfect Holidays.</Text></Text>
           </View>

           {/* Mobile Elite Category Slider (Reference Image Align) */}
           <View style={styles.categoriesWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.categoryScroll}
              >
                {categories.length > 0 ? [
                  ...categories.filter(cat => cat.slug !== 'activities'),
                  ...(!categories.find(c => c.slug === 'sea-activities') ? [{ id: 'sea-act', name: 'Sea Activities', slug: 'activities-sea', image_url: '' }] : []),
                  ...(!categories.find(c => c.slug === 'land-activities') ? [{ id: 'land-act', name: 'Land Activities', slug: 'activities-land', image_url: '' }] : [])
                ].map((cat: any) => (
                  <CategoryCard 
                    key={cat.id} 
                    name={cat.name} 
                    slug={cat.slug}
                    image_url={cat.image_url} 
                    onPress={() => {
                      if (cat.slug === 'flights') {
                        router.push('/flights');
                      } else {
                        router.push({
                          pathname: '/explore',
                          params: { category: cat.slug }
                        });
                      }
                    }} 
                  />
                )) : [1,2,3,4].map(k => <View key={k} style={[styles.categorySkeleton, {width: 156, height: 240}]} />)}
              </ScrollView>
           </View>

           {/* Premium Quick Filters (Restored with Better UI) */}
           <View style={styles.quickFiltersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersScroll}>
                <TouchableOpacity style={[styles.quickFilterCard, { backgroundColor: '#FEF2F2' }]} onPress={() => router.push('/explore?benefits=all-inclusive')}>
                  <View style={[styles.quickFilterIcon, { backgroundColor: Colors.primary }]}>
                    <Sparkles size={18} color={Colors.white} />
                  </View>
                  <View>
                    <Text style={styles.quickFilterLabel}>ALL-INCLUSIVE</Text>
                    <Text style={styles.quickFilterSublabel}>Luxury Stays</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickFilterCard, { backgroundColor: '#F0FDF4' }]} onPress={() => router.push('/local-deals')}>
                  <View style={[styles.quickFilterIcon, { backgroundColor: '#10B981' }]}>
                    <Percent size={18} color={Colors.white} />
                  </View>
                  <View>
                    <Text style={styles.quickFilterLabel}>BEST PRICES</Text>
                    <Text style={styles.quickFilterSublabel}>Local Resident Deals</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickFilterCard, { backgroundColor: '#EFF6FF' }]} onPress={() => router.push('/flights')}>
                  <View style={[styles.quickFilterIcon, { backgroundColor: '#3B82F6' }]}>
                    <Plane size={18} color={Colors.white} />
                  </View>
                  <View>
                    <Text style={styles.quickFilterLabel}>FLIGHTS</Text>
                    <Text style={styles.quickFilterSublabel}>Global Routes</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
         </View>

        {/* Exclusive Deals with Benefit Visibility */}
        <View style={[styles.section, styles.featuredSection]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.labelTitle}>
                {contentBlocks.offers?.label || 'EXCLUSIVE OFFERS'}
              </Text>
              <Text style={styles.sectionTitle}>
                {contentBlocks.offers?.title || 'Promotional Deals'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/explore')}>
                <Text style={styles.viewAll}>
                    {contentBlocks.offers?.view_all || 'VIEW ALL'}
                </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
            {featuredServices && featuredServices.length > 0 ? (
              featuredServices
                .filter(s => s && (s.name?.toLowerCase().includes('evening package') || s.service_type?.toLowerCase().includes('evening package')))
                .map((service) => (
                <ServiceCard 
                  key={service.id} 
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
                  deal_note={service.deal_note}
                  short_description={service.short_description || service.description}
                  onPress={() => router.push(`/services/${service.id}`)}
                />
              ))
            ) : isLoading ? (
              <ActivityIndicator style={{ marginLeft: 24 }} color={Colors.primary} />
            ) : (
              <Text style={{ marginLeft: 24, color: Colors.slate[400], fontFamily: 'Outfit_500Medium' }}>No featured deals today.</Text>
            )}
          </ScrollView>
        </View>

        {/* Core Logic 2: Book / WhatsApp / Contact */}
        <View style={styles.conversionCta}>
            <View style={styles.ctaCard}>
                <View style={styles.ctaContent}>
                    <Text style={styles.labelTitleWhite}>
                        {contentBlocks.support?.label || '24/7 SUPPORT'}
                    </Text>
                    <Text style={styles.ctaTitle}>
                        {contentBlocks.support?.title || 'Tailor Your Journey'}
                    </Text>
                    <Text style={styles.ctaText}>
                        {contentBlocks.support?.description || 'Book your services directly or chat with our travel designers.'}
                    </Text>
                </View>
                <View style={styles.ctaActions}>
                    <TouchableOpacity style={styles.primaryCta} onPress={() => router.push('/tailormade')}>
                        <Sparkles size={20} color={Colors.white} />
                        <Text style={styles.primaryCtaText}>
                            {contentBlocks.support?.cta || 'START PLANNING'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryCta} onPress={() => handleInquiry('whatsapp')}>
                         <MessageCircle size={18} color={Colors.charcoal} />
                         <Text style={styles.secondaryCtaText}>
                            {contentBlocks.support?.whatsapp || 'WHATSAPP'}
                         </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>

        {/* Partners Slider Section */}
        <View style={styles.partnersSection}>
           <View style={styles.partnerHeader}>
              <View style={styles.partnerLine} />
              <Text style={styles.partnerLabel}>
                {contentBlocks.partners?.label || 'OUR GLOBAL PARTNERS'}
              </Text>
              <View style={styles.partnerLine} />
           </View>
           <PartnerSlider />
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  logo: { width: 160, height: 44 },
  headerActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  valuationSection: { padding: 24, backgroundColor: Colors.white },
  searchBarWrapper: {
    flexDirection: 'row',
    height: 74,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  searchLabel: {
    fontFamily: 'Outfit_900Black',
    fontSize: 8,
    color: Colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  searchValue: {
    fontFamily: 'Outfit_900Black',
    fontSize: 11,
    color: Colors.charcoal,
  },
  searchDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  searchPlaceholder: { flex: 1, fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.slate[400] },
  categoriesWrapper: { marginTop: 24, marginBottom: 24 },
  categoryScroll: { paddingRight: 24 },
  categorySkeleton: { backgroundColor: Colors.slate[50], borderRadius: 40, marginRight: 16 },
  quickFiltersContainer: { marginTop: 12 },
  quickFiltersScroll: { paddingRight: 24 },
  quickFilterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    marginRight: 12,
    minWidth: 180,
    gap: 12,
  },
  quickFilterIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilterLabel: {
    fontFamily: 'Outfit_900Black',
    fontSize: 12,
    color: Colors.charcoal,
    letterSpacing: 0.5,
  },
  quickFilterSublabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 10,
    color: Colors.slate[500],
    marginTop: -2,
  },
  discoverySection: { paddingVertical: 16 },
  destCardWrapper: { height: 260 },
  destCard: { width: '100%', height: '100%', borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  destImage: { width: '100%', height: '100%' },
  destOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'flex-end', padding: 24 },
  destLabelWrapper: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 16, borderRadius: 24 },
  destType: { fontFamily: 'Outfit_900Black', fontSize: 10, letterSpacing: 2, color: Colors.primary },
  destName: { fontFamily: 'Outfit_900Black', fontSize: 22, color: Colors.charcoal, letterSpacing: -0.5 },
  section: { paddingVertical: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, marginBottom: 24 },
  labelTitle: { fontFamily: 'Outfit_900Black', fontSize: 11, letterSpacing: 4, color: Colors.primary, textTransform: 'uppercase' },
  labelTitleWhite: { fontFamily: 'Outfit_900Black', fontSize: 11, letterSpacing: 4, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  sectionTitle: { fontFamily: 'Outfit_900Black', fontSize: 28, color: Colors.charcoal, letterSpacing: -1 },
  viewAll: { fontFamily: 'Outfit_900Black', fontSize: 12, letterSpacing: 1.5, color: Colors.charcoal },
  featuredSection: { backgroundColor: Colors.slate[50], borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  featuredList: { paddingLeft: 24, paddingRight: 8 },
  conversionCta: { padding: 24 },
  ctaCard: { backgroundColor: Colors.charcoal, borderRadius: 40, padding: 32, gap: 24 },
  ctaContent: { gap: 8 },
  ctaTitle: { color: Colors.white, fontSize: 24, fontFamily: 'Outfit_900Black' },
  ctaText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'Outfit_500Medium', lineHeight: 22 },
  ctaActions: { flexDirection: 'row', gap: 12 },
  primaryCta: { flex: 1.2, height: 60, backgroundColor: Colors.primary, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryCtaText: { color: Colors.white, fontFamily: 'Outfit_900Black', fontSize: 12, letterSpacing: 1 },
  secondaryCta: { flex: 0.8, height: 60, backgroundColor: Colors.white, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryCtaText: { color: Colors.charcoal, fontFamily: 'Outfit_900Black', fontSize: 10, letterSpacing: 1 },
  servicesHeader: { marginTop: 32, marginBottom: 16 },
  partnersSection: { marginTop: 40, paddingBottom: 20 },
  partnerHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, marginBottom: 12 },
  partnerLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  partnerLabel: { fontFamily: 'Outfit_900Black', fontSize: 9, letterSpacing: 4, color: Colors.slate[400] },
  footerSpacing: { height: 120 },
});

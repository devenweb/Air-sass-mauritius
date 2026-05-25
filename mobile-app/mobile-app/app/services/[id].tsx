import React from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Share } from 'react-native';
import { Text, ActivityIndicator, Surface } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useServiceDetails } from '../../src/hooks/useServiceDetails';
import { useRoomTypes, RoomType } from '../../src/hooks/useRoomTypes';
import { 
  MapPin, ArrowLeft, Share2, Mail, Clock, Info, Check, X, 
  Calendar as CalendarIcon, Tag, Moon, MessageCircle, Phone, 
  Sparkles, Users, Utensils, Wifi, Monitor, Waves, Flower2, 
  Dumbbell, Car, GlassWater, ConciergeBell, Wind, Umbrella, 
  WashingMachine, Coffee, Tv, ShieldCheck, Briefcase, Plane, 
  Bath, Bike, Zap, Map 
} from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { BookingModal } from '../../src/components/BookingModal';
import { supabase } from '../../src/lib/supabase';
import { useSettings } from '../../src/context/SettingsContext';
import { resolveImageUrl } from '../../src/utils/imageUtils';
import { PremiumCarousel } from '../../src/components/PremiumCarousel';
import { useServiceAddons } from '../../src/hooks/useServiceAddons';
import { StarRating } from '../../src/components/StarRating';
import { User } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWishlist } from '../../src/context/WishlistContext';
import { stripHtml } from '../../src/utils/textUtils';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 450;

const AMENITY_ICONS: Record<string, any> = {
  'wifi': Wifi,
  'free wifi': Wifi,
  'internet': Wifi,
  'computer': Monitor,
  'pool': Waves,
  'infinity pool': Waves,
  'swimming pool': Waves,
  'water activities': Waves,
  'spa': Flower2,
  'wellness': Flower2,
  'massage': Flower2,
  'gym': Dumbbell,
  'fitness': Dumbbell,
  'parking': Car,
  'free parking': Car,
  'restaurant': Utensils,
  'dining': Utensils,
  'bar': GlassWater,
  'lounge': GlassWater,
  'cocktail': GlassWater,
  'room service': ConciergeBell,
  'ac': Wind,
  'air conditioning': Wind,
  'beach': Umbrella,
  'towels': Wind,
  'private beach': Umbrella,
  'laundry': WashingMachine,
  'cleaning': WashingMachine,
  'concierge': ConciergeBell,
  'breakfast': Coffee,
  'tv': Tv,
  'television': Tv,
  'security': ShieldCheck,
  'business center': Briefcase,
  'shop': Briefcase,
  'airport shuttle': Plane,
  'transfer': Plane,
  'bath': Bath,
  'bathtub': Bath,
  'bicycle': Bike,
  'bike': Bike,
  'electricity': Zap,
  'power': Zap,
  'games': Zap,
  'view': Map
};

function getAmenityIcon(amenity: string) {
  const key = amenity.toLowerCase().trim();
  for (const [name, Icon] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(name)) return Icon;
  }
  return Sparkles;
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { mobileConfig, generalConfig } = useSettings();
  const { service, isLoading, error } = useServiceDetails(id);
  // FIX-4: Skip room_types table fetch when service already has JSONB room_types populated
  const hasJsonRooms = Array.isArray(service?.room_types) && service.room_types.length > 0;
  const { roomTypes: hookRoomTypes } = useRoomTypes(id as string, hasJsonRooms);
  const { reviews, faqs } = useServiceAddons(id as string);
  const { toggleWishlist, isInWishlist } = useWishlist();

  const roomTypes = React.useMemo<RoomType[]>(() => {
    const pricing = (service as any)?.service_pricing || [];
    
    // 1. Check for JSONB room_types in the service object first (from services table)
    if (service?.room_types && Array.isArray(service.room_types) && service.room_types.length > 0) {
      return service.room_types.map((room: any, index: number) => {
        // Match price from grid if not in JSONB
        let weekday = typeof room.prices?.mon === 'string' ? parseFloat(room.prices.mon) : (room.prices?.mon || 0);
        let weekend = typeof room.prices?.sat === 'string' ? parseFloat(room.prices.sat) : (room.prices?.sat || 0);

        if (weekday === 0 && pricing.length > 0) {
          const matchedPrice = pricing.find((p: any) => p.label?.toLowerCase() === (room.type || room.name)?.toLowerCase())?.price;
          if (matchedPrice) weekday = Number(matchedPrice);
        }
        
        return {
          id: `json-${index}`,
          name: room.type || room.name || 'Standard Room',
          weekday_price: weekday,
          weekend_price: weekend || weekday, // Fallback weekend to weekday if 0
          min_stay_days: parseInt(room.min_stay_days || room.min_stay) || 1,
          image_url: room.image_url || room.image,
          meal_plan: room.meal_plan || room.mealPlan,
          max_adults: room.max_adults || room.maxAdults || 2,
          max_teens: room.max_teens || room.maxTeens || 0,
          max_children: room.max_children || room.maxChildren || 0,
          max_infants: room.max_infants || room.maxInfants || 0,
          description: room.description || room.details || room.desc,
          amenities: Array.isArray(room.features) ? room.features : 
                     (typeof room.features === 'string' ? room.features.split(',').map((f: string) => f.trim()) : [])
        };
      });
    }
    return hookRoomTypes || [];
  }, [service, hookRoomTypes]);

  const [bookingVisible, setBookingVisible] = React.useState(false);

  const handleInquiry = (method: 'whatsapp' | 'email') => {
    const contact = {
      phone: mobileConfig?.supportPhone || generalConfig?.contactPhone || '+230 5940 7701',
      email: generalConfig?.contactEmail || 'office@travel-lounge.com'
    };
    const message = `Inquiry for: ${service?.name} (ID: ${id})`;
    if (method === 'whatsapp') Linking.openURL(`https://wa.me/${contact.phone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`);
    if (method === 'email') Linking.openURL(`mailto:${contact.email}?subject=${encodeURIComponent(message)}`);
  };

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (error || !service) return <View style={styles.loadingContainer}><Text>Service not found</Text></View>;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container} stickyHeaderIndices={[1]}>
        {/* Elite Image Header / Gallery */}
        <View style={styles.imageContainer}>
          {(service.gallery_images && service.gallery_images.length > 0) ? (
            <PremiumCarousel
              data={service.gallery_images.map(img => ({ image: img }))}
              itemWidth={width}
              gap={0}
              showIndicators={true}
              renderItem={({ item }: { item: { image: string } }) => (
                <View style={{ width, height: HEADER_HEIGHT }}>
                  <Image source={resolveImageUrl(item.image)} style={styles.image} />
                </View>
              )}
            />
          ) : (
            <Image 
              source={resolveImageUrl(service.banner_url || service.image_url)} 
              style={styles.image} 
            />
          )}
          <View style={styles.overlay} />
          <View style={styles.topControls}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}><ArrowLeft color={Colors.white} size={22} /></TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                if (service) {
                  Share.share({ message: `Check out ${service.name} on Travel Lounge` });
                }
              }} 
              style={styles.iconButton}
            >
              <Share2 color={Colors.white} size={22} />
            </TouchableOpacity>
            
            {/* Added Wishlist Button for full parity */}
            <TouchableOpacity 
              onPress={() => {
                if (service) {
                  toggleWishlist(service as any);
                }
              }} 
              style={styles.iconButton}
            >
              <MaterialCommunityIcons 
                name={isInWishlist(service?.id || '') ? "heart" : "heart-outline"} 
                color={isInWishlist(service?.id || '') ? "#DC2626" : Colors.white} 
                size={22} 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.titleOverlay}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}><Text style={styles.categoryText}>{service.category || 'Experience'}</Text></View>
              {service.rating && (
                <View style={styles.ratingBadge}>
                  <StarRating rating={service.rating} size={12} color="#FFFFFF" />
                  <Text style={styles.ratingText}>{service.rating} RATING</Text>
                </View>
              )}
            </View>
            <Text style={styles.name}>{service.name}</Text>
            <View style={styles.metaRow}>
              {service.location && (
                <View style={styles.locationContainer}><MapPin color="#CBD5E1" size={14} /><Text style={styles.location}>{service.location}</Text></View>
              )}
              {service.meal_plans && Array.isArray(service.meal_plans) && service.meal_plans.length > 0 && (
                <View style={styles.headerMealPlanContainer}>
                  <Utensils color="#FFFFFF" size={14} />
                  <Text style={styles.headerMealPlanText}>
                    {service.meal_plans.map((mp: any) => typeof mp === 'string' ? mp : (mp as any).label).join(' • ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Conversion Bar (Sticky) */}
        <View style={styles.stickyActionWrapper}>
            <View style={styles.actionConversionBar}>
                <TouchableOpacity style={styles.actionItem} onPress={() => handleInquiry('whatsapp')}>
                    <MessageCircle size={20} color={Colors.primary} />
                    <Text style={styles.actionText}>WHATSAPP</Text>
                </TouchableOpacity>
                <View style={styles.actionDivider} />
                <TouchableOpacity style={styles.actionItem} onPress={() => handleInquiry('email')}>
                    <Mail size={20} color={Colors.charcoal} />
                    <Text style={styles.actionText}>EMAIL</Text>
                </TouchableOpacity>
                <View style={styles.actionDivider} />
                <TouchableOpacity style={styles.actionItem} onPress={() => setBookingVisible(true)}>
                    <CalendarIcon size={20} color={Colors.charcoal} />
                    <Text style={styles.actionText}>BOOKING</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <View style={styles.valuationHeader}>
            <View>
              <Text style={styles.valuationLabel}>EXECUTIVE PRICE</Text>
              <Text style={styles.valuationValue}>Rs {(service.price ?? 0).toLocaleString()}</Text>
            </View>
            <View style={styles.benefitBadge}>
               <Sparkles size={14} color="#D97706" />
               <Text style={styles.benefitBadgeText}>{service.category?.toUpperCase() === 'HOTEL' ? 'ALL-INCLUSIVE' : 'ELITE CHOICE'}</Text>
            </View>
          </View>
          
          {/* Quick Info Bar for Activities/Tours */}
          {(service.service_type !== 'hotel' && service.category?.toLowerCase() !== 'stay' && (service.duration_days || service.duration_hours || service.max_group_size || service.location)) && (
            <View style={styles.quickInfoBar}>
              {service.duration_days ? (
                <View style={styles.quickInfoItem}>
                  <Clock size={16} color={Colors.primary} />
                  <Text style={styles.quickInfoText}>{service.duration_days} Days</Text>
                </View>
              ) : service.duration_hours ? (
                <View style={styles.quickInfoItem}>
                  <Clock size={16} color={Colors.primary} />
                  <Text style={styles.quickInfoText}>{service.duration_hours} Hours</Text>
                </View>
              ) : null}
              
              {service.max_group_size && (
                <View style={styles.quickInfoItem}>
                  <Users size={16} color={Colors.primary} />
                  <Text style={styles.quickInfoText}>Max {service.max_group_size}</Text>
                </View>
              )}

              {service.location && (
                <View style={styles.quickInfoItem}>
                  <MapPin size={16} color={Colors.primary} />
                  <Text style={styles.quickInfoText}>{service.location.split(',')[0]}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Experience</Text>
            <View style={styles.introContainer}>
              <View style={styles.introContent}>
                <Text style={styles.description}>{stripHtml(service.description) || "Discover the beauty and luxury of this carefully curated experience by Travel Lounge."}</Text>
                {service.special_features && Array.isArray(service.special_features) && service.special_features.length > 0 && (
                  <View style={styles.specialFeaturesRow}>
                    {service.special_features.map((feature, idx) => (
                      <View key={idx} style={styles.specialFeatureChip}>
                        <Text style={styles.specialFeatureText}>{typeof feature === 'string' ? feature : (feature as any).item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              {service.secondary_image_url && (
                <Image 
                  source={resolveImageUrl(service.secondary_image_url)} 
                  style={styles.secondaryImage} 
                />
              )}
            </View>
          </View>

          {/* Multi-Image Experience Gallery */}
          {service.gallery_images && service.gallery_images.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Multi-Image Experience</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContent}>
                {service.gallery_images.map((img, idx) => (
                  <TouchableOpacity key={idx} activeOpacity={0.9}>
                    <Surface style={styles.galleryCard} elevation={2}>
                      <Image source={resolveImageUrl(img)} style={styles.galleryImage} />
                    </Surface>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Variants / Rooms Section - Unified for Hotels & Packages */}
          {roomTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {service.category?.toLowerCase()?.includes('hotel') || service.category?.toLowerCase() === 'stay' 
                  ? 'Choose Your Room' 
                  : 'Choose Your Itinerary'}
              </Text>
              {roomTypes.map((room) => (
                <Surface key={room.id} style={styles.roomCard} elevation={0}>
                  <Image source={resolveImageUrl(room.image_url)} style={styles.roomImage} />
                  <View style={styles.roomContent}>
                    <View style={styles.roomHeaderRow}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      {room.meal_plan && (
                        <View style={styles.mealPlanBadge}>
                          <Utensils size={10} color="#D97706" />
                          <Text style={styles.mealPlanText}>{room.meal_plan.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>

                    {room.description && (
                      <Text style={styles.roomDesc} numberOfLines={3}>
                        {stripHtml(room.description)}
                      </Text>
                    )}

                    {room.weekday_price > 0 && (
                      <View style={styles.variantPriceBadge}>
                        <Text style={styles.variantPriceLabel}>FROM</Text>
                        <Text style={styles.variantPriceVal}>Rs {room.weekday_price.toLocaleString()}</Text>
                      </View>
                    )}
                    
                    <View style={styles.occupancyRow}>
                      <View style={styles.occupancyItem}>
                        <Users size={14} color={Colors.slate[400]} />
                        <Text style={styles.occupancyText}>{room.max_adults || 2} Adults</Text>
                      </View>
                      {(room.max_teens || 0) > 0 && (
                        <View style={styles.occupancyItem}>
                          <Users size={12} color={Colors.slate[400]} />
                          <Text style={styles.occupancyText}>{room.max_teens} Teens</Text>
                        </View>
                      )}
                      {(room.max_children || 0) > 0 && (
                        <View style={styles.occupancyItem}>
                          <Users size={12} color={Colors.slate[400]} />
                          <Text style={styles.occupancyText}>{room.max_children} Children</Text>
                        </View>
                      )}
                      {(room.max_infants || 0) > 0 && (
                        <View style={styles.occupancyItem}>
                          <Users size={10} color={Colors.slate[400]} />
                          <Text style={styles.occupancyText}>{room.max_infants} Infants</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.roomDivider} />

                    {/* Features section instead of Contact Us grid */}
                    <View style={styles.roomFeaturesGrid}>
                      {room.amenities?.slice(0, 4).map((amenity, idx) => {
                        const Icon = getAmenityIcon(amenity);
                        return (
                          <View key={idx} style={styles.featureItem}>
                            <Icon size={12} color={Colors.primary} />
                            <Text style={styles.featureText} numberOfLines={1}>{amenity}</Text>
                          </View>
                        );
                      })}
                      {room.meal_plan && (
                        <View style={styles.featureItem}>
                          <Utensils size={12} color="#D97706" />
                          <Text style={[styles.featureText, {color: '#D97706'}]}>{room.meal_plan}</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity style={styles.selectRoomBtn} onPress={() => setBookingVisible(true)}>
                      <Text style={styles.selectRoomBtnText}>
                        {service.category?.toLowerCase()?.includes('hotel') || service.category?.toLowerCase() === 'stay' 
                          ? 'SELECT THIS ROOM' 
                          : 'SELECT THIS ITINERARY'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Surface>
              ))}
            </View>
          )}

          {/* Itinerary Section */}
          {service.itinerary && service.itinerary.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>The Journey</Text>
              {(service.itinerary as any[]).map((item, index) => (
                <View key={index} style={styles.journeyItem}>
                  <View style={styles.journeyLineWrapper}>
                    <View style={styles.journeyDot} />
                    {index !== (service.itinerary?.length || 0) - 1 && <View style={styles.journeyLine} />}
                  </View>
                  <View style={styles.journeyContent}>
                     <Text style={styles.journeyTime}>{item?.day || item?.time}</Text>
                     <Text style={styles.journeyTitle}>{item?.title}</Text>
                     {item.image_url && (
                        <Image source={{ uri: item.image_url }} style={styles.journeyImage} />
                      )}
                     <Text style={styles.journeyDesc}>{stripHtml(item?.description)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Essentials Section (Highlights, Included, Not Included) */}
          {( (service.highlights && (Array.isArray(service.highlights) ? service.highlights.length > 0 : service.highlights.length > 0)) || 
             (service.included && (Array.isArray(service.included) ? service.included.length > 0 : true)) ) && (
            <View style={styles.section}>
              <View style={styles.essentialsHeader}>
                <View style={styles.essentialsIconCircle}>
                  <Info size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.essentialsSubtitle}>ESSENTIALS</Text>
                  <Text style={styles.essentialsTitle}>Highlights & Inclusions</Text>
                </View>
              </View>

              <View style={styles.essentialsCard}>
                {service.highlights && (
                  <View style={styles.essentialsGroup}>
                    <Text style={styles.essentialsGroupTitle}>KEY HIGHLIGHTS</Text>
                    {(Array.isArray(service.highlights) ? service.highlights : (service.highlights as string).split('\n')).map((item, idx) => (
                      <View key={idx} style={styles.essentialHighlightItem}>
                        <View style={styles.essentialHighlightDot} />
                        <Text style={styles.essentialHighlightText}>{typeof item === 'string' ? item.trim() : (item as any).item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {service.included && (
                  <View style={[styles.essentialsGroup, { marginTop: 24 }]}>
                    <Text style={[styles.essentialsGroupTitle, { color: '#059669' }]}>WHAT'S INCLUDED</Text>
                    {(Array.isArray(service.included) ? service.included : [service.included]).map((item, idx) => (
                      <View key={idx} style={styles.inclusionItem}>
                        <View style={styles.inclusionIconCircle}>
                          <Check size={10} color="#059669" strokeWidth={3} />
                        </View>
                        <Text style={styles.inclusionText}>{typeof item === 'string' ? item : (item as any).item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {service.not_included && (
                  <View style={[styles.essentialsGroup, { marginTop: 24 }]}>
                    <Text style={styles.essentialsGroupTitle}>WHAT'S NOT INCLUDED</Text>
                    {(Array.isArray(service.not_included) ? service.not_included : [service.not_included]).map((item, idx) => (
                      <View key={idx} style={styles.inclusionItem}>
                        <View style={[styles.inclusionIconCircle, { backgroundColor: '#F1F5F9' }]}>
                          <X size={10} color={Colors.slate[400]} strokeWidth={3} />
                        </View>
                        <Text style={[styles.inclusionText, { color: Colors.slate[400] }]}>{typeof item === 'string' ? item : (item as any).item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Property Amenities - High Parity with Web */}
          {service.amenities && (Array.isArray(service.amenities) ? (service.amenities.length > 0) : ((service.amenities as any).length > 0)) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities & Services</Text>
              <View style={styles.amenitiesGrid}>
                {(Array.isArray(service.amenities) ? service.amenities : (service.amenities as string).split(',')).map((item, idx) => {
                  const Icon = getAmenityIcon(item);
                  return (
                    <View key={idx} style={styles.premiumAmenityItem}>
                      <View style={styles.amenityIconWrapper}>
                        <Icon size={18} color={Colors.slate[400]} />
                      </View>
                      <Text style={styles.premiumAmenityText}>{item.trim().toUpperCase()}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Policies & Facts */}
          {(service.cancellation_policy || service.terms_and_conditions) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Policies & Facts</Text>
              <View style={styles.policiesStack}>
                {service.cancellation_policy && (
                  <View style={styles.premiumPolicyItem}>
                    <View style={styles.policyIconCircle}>
                      <Info size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.policyContent}>
                      <Text style={styles.policyItemTitle}>Cancellation Policy</Text>
                      <Text style={styles.policyItemText}>{stripHtml(service.cancellation_policy as string)}</Text>
                    </View>
                  </View>
                )}
                {service.terms_and_conditions && (
                  <View style={[styles.premiumPolicyItem, { marginTop: 24 }]}>
                    <View style={[styles.policyIconCircle, { backgroundColor: '#F1F5F9' }]}>
                      <Clock size={20} color={Colors.charcoal} />
                    </View>
                    <View style={styles.policyContent}>
                      <Text style={styles.policyItemTitle}>Terms & Conditions</Text>
                      <Text style={styles.policyItemText}>{stripHtml(service.terms_and_conditions as string)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Client Impressions (Reviews) */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Client Impressions</Text>
                <View style={styles.avgRatingRow}>
                  <StarRating rating={reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length} size={14} />
                  <Text style={styles.avgRatingText}>({reviews.length})</Text>
                </View>
              </View>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUserIcon}><User size={16} color={Colors.slate[400]} /></View>
                    <View>
                      <Text style={styles.reviewUser}>{review.customer_name}</Text>
                      <StarRating rating={review.rating} size={10} />
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>"{review.comment}"</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 160 }} />
        </View>
      </ScrollView>

      {/* Elite Sticky Footer Conversion */}
      <Surface style={styles.footerBar} elevation={5}>
          <View style={styles.footerInfo}>
              <Text style={styles.footerPriceLabel}>AS FROM</Text>
              <Text style={styles.footerPriceVal}>Rs {service.price?.toLocaleString() || '0'}</Text>
          </View>
         <TouchableOpacity style={styles.footerCta} onPress={() => setBookingVisible(true)}>
             <Text style={styles.footerCtaText}>CONTINUE BOOKING</Text>
         </TouchableOpacity>
      </Surface>

      <BookingModal
        visible={bookingVisible}
        onDismiss={() => setBookingVisible(false)}
        service={{ 
          id: service.id, 
          name: service.name, 
          price: service.price, 
          childPrice: (service as any).child_price,
          category: service.category,
          meal_plans: (service as any).meal_plans,
          room_types: roomTypes // Pass the mapped room types including meal_plan
        }}
        onSubmit={async (data) => {
          try {
            // 1. Identify or create customer via secure RPC (Web-App Parity)
            const { data: { user } } = await supabase.auth.getUser();
            
            const { data: customerId, error: customerError } = await supabase.rpc('get_or_create_customer_v1', {
              p_email: user?.email || data.email,
              p_first_name: data.firstName,
              p_last_name: data.lastName,
              p_phone: data.phone,
              p_user_id: user?.id
            });

            if (customerError) throw customerError;
            if (!customerId) throw new Error('Could not identify or create customer');

            // 2. Prepare payload for the transactional booking RPC (Web-App Parity)
            // console.log('--- Submitting Mobile Booking ---');
            // console.log('Payload:', JSON.stringify({
            //   customer_id: customerId,
            //   check_in_date: data.checkIn,
            //   check_out_date: data.checkOut,
            //   pax_adults: data.paxAdults,
            //   pax_infants: data.paxInfants,
            //   pax_children: data.paxChildren,
            //   pax_teens: data.paxTeens,
            //   amount: data.totalAmount,
            //   service_type: service.category || 'General',
            //   service_name: service.name,
            //   description: `Room: ${data.roomType}, Meal: ${data.mealPreference}, Special: ${data.specialRequirements}`
            // }, null, 2));

            const bookingPayload = {
              customer_id: customerId,
              check_in_date: new Date(data.checkIn).toISOString(),
              check_out_date: new Date(data.checkOut).toISOString(),
              status: 'pending',
              pax_adults: data.paxAdults,
              pax_infants: data.paxInfants,
              pax_children: data.paxChildren,
              pax_teens: data.paxTeens,
              amount: data.totalAmount, // Use amount for schema parity
              tax_amount: 0,
              service_type: service.category || 'General',
              service_name: service.name,
              lead_data: {
                ...data,
                service_name: service.name,
                category: service.category,
                selected_addons: data.addons // Explicitly capture addons
              },
              description: data.roomType 
                ? `Booking for ${service.name}. Room: ${data.roomType}. Addons: ${(data.addons || []).join(', ') || 'None'}`
                : `Booking for ${service.name}. Addons: ${(data.addons || []).join(', ') || 'None'}`,
              /* PREVIOUS DESCRIPTION PRESERVED AS COMMENT PER USER RULES:
              description: data.roomType 
                ? `Booking for ${service.name}. Room: ${data.roomType}. Addons: ${data.addons.join(', ') || 'None'}`
                : `Booking for ${service.name}. Addons: ${data.addons.join(', ') || 'None'}`,
              */
              created_at: new Date().toISOString()
            };

            const itemsPayload = [{
              service_id: service.id,
              service_name: service.name,
              service_category: service.category || 'General',
              amount: data.totalAmount // Use calculated total from modal
            }];

            // 3. Execute transactional insert via RPC
            const { error: rpcError } = await supabase.rpc('create_booking_v1', {
              p_booking_data: bookingPayload,
              p_items_data: itemsPayload
            });

            if (rpcError) throw rpcError;
            
            // 4. Trigger Email Notification via Web-App API (Production Parity)
            try {
              const bookingRef = `TL-${Date.now().toString().slice(-6)}`;
              
              // Note: Non-blocking fetch to prevent UI hang on slow production networks
              fetch('https://www.travellounge.mu/api/notify/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: data.email,
                  customerName: `${data.firstName} ${data.lastName}`,
                  bookingId: bookingRef,
                  serviceName: service.name,
                  amount: data.totalAmount,
                  checkIn: data.checkIn,
                  checkOut: data.checkOut,
                  adults: data.paxAdults,
                  teens: data.paxTeens,
                  children: data.paxChildren,
                  infants: data.paxInfants,
                  phone: data.phone,
                  roomPreference: data.roomType,
                  mealPreference: data.mealPreference !== 'none' ? data.mealPreference : 'As per room type',
                  notes: data.specialRequirements,
                  serviceCategory: service.category || 'hotel',
                  isLocalDeal: service.location?.toLowerCase().includes('mauritius') || false,
                  addons: data.addons // Pass selected addons to notification
                })
              });
            } catch (emailErr) {
              console.error('[Mobile/Booking] Email notification failed (background):', emailErr);
            }

          } catch (error: any) {
            console.error('Mobile booking submission failed:', error.message || error);
            throw error; 
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { height: HEADER_HEIGHT, position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  topControls: { position: 'absolute', top: 60, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(15, 23, 42, 0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  titleOverlay: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  categoryBadge: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  categoryText: { color: Colors.white, fontFamily: 'Outfit_900Black', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
  name: { color: Colors.white, fontFamily: 'Outfit_900Black', fontSize: 32, letterSpacing: -1, marginBottom: 8 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  location: { color: '#CBD5E1', fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  stickyActionWrapper: { zIndex: 100, backgroundColor: 'transparent' },
  actionConversionBar: { 
    flexDirection: 'row', 
    height: 74, 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 24, 
    marginTop: -37, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    shadowColor: '#0F172A', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 20, 
    elevation: 5,
    width: width - 48,
    alignSelf: 'center'
  },
  actionItem: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 },
  actionText: { fontFamily: 'Outfit_900Black', fontSize: 9, color: Colors.charcoal, letterSpacing: 1 },
  actionDivider: { width: 1, height: 30, backgroundColor: Colors.border, alignSelf: 'center' },
  content: { padding: 24, paddingTop: 40 },
  valuationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  valuationLabel: { fontFamily: 'Outfit_900Black', fontSize: 10, letterSpacing: 3, color: Colors.slate[400] },
  valuationValue: { fontFamily: 'Outfit_900Black', fontSize: 32, color: Colors.primary, letterSpacing: -1 },
  benefitBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  benefitBadgeText: { color: '#D97706', fontFamily: 'Outfit_900Black', fontSize: 10, letterSpacing: 1 },
  quickInfoBar: { 
    flexDirection: 'row', 
    backgroundColor: Colors.slate[50], 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 32,
    gap: 20
  },
  quickInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickInfoText: { fontFamily: 'Outfit_900Black', fontSize: 12, color: Colors.charcoal },
  section: { marginBottom: 40 },
  sectionTitle: { fontFamily: 'Outfit_900Black', fontSize: 13, letterSpacing: 4, color: Colors.charcoal, textTransform: 'uppercase', marginBottom: 20 },
  introContainer: { flexDirection: 'row', gap: 20 },
  introContent: { flex: 1 },
  secondaryImage: { width: 140, height: 200, borderRadius: 24, resizeMode: 'cover' },
  specialFeaturesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  specialFeatureChip: { backgroundColor: Colors.slate[50], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  specialFeatureText: { fontFamily: 'Outfit_900Black', fontSize: 10, color: Colors.slate[400], textTransform: 'uppercase', letterSpacing: 1 },
  badgeRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' },
  ratingBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  ratingText: { color: Colors.white, fontFamily: 'Outfit_900Black', fontSize: 9, letterSpacing: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' },
  headerMealPlanContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerMealPlanText: { color: Colors.white, fontFamily: 'Outfit_700Bold', fontSize: 12, textTransform: 'uppercase' },
  essentialsHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  essentialsIconCircle: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  essentialsSubtitle: { fontFamily: 'Outfit_900Black', fontSize: 10, color: Colors.primary, letterSpacing: 3 },
  essentialsTitle: { fontFamily: 'Outfit_900Black', fontSize: 20, color: Colors.charcoal },
  essentialsCard: { backgroundColor: Colors.white, borderRadius: 32, padding: 0 },
  essentialsGroup: { },
  essentialsGroupTitle: { fontFamily: 'Outfit_900Black', fontSize: 11, color: Colors.slate[400], letterSpacing: 2, marginBottom: 16 },
  essentialHighlightItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  essentialHighlightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  essentialHighlightText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.charcoal },
  inclusionIconCircle: { width: 22, height: 22, borderRadius: 7, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  premiumAmenityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '48%', marginBottom: 16 },
  amenityIconWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.slate[50], justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  premiumAmenityText: { fontFamily: 'Outfit_900Black', fontSize: 9, color: Colors.slate[500], letterSpacing: 1, flex: 1 },
  description: { fontFamily: 'Outfit_500Medium', fontSize: 16, color: Colors.slate[500], lineHeight: 28 },
  roomCard: { borderRadius: 32, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 20 },
  roomImage: { width: '100%', height: 200 },
  roomContent: { padding: 24 },
  roomName: { fontFamily: 'Outfit_900Black', fontSize: 20, color: Colors.charcoal, marginBottom: 8 },
  roomDesc: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.slate[500], lineHeight: 18, marginBottom: 16 },
  priceGrid: { flexDirection: 'row', gap: 20, backgroundColor: Colors.slate[50], padding: 16, borderRadius: 20 },
  priceCell: { flex: 1 },
  priceCellTitle: { fontFamily: 'Outfit_900Black', fontSize: 9, letterSpacing: 1, color: Colors.slate[400], marginBottom: 4 },
  priceCellVal: { fontFamily: 'Outfit_900Black', fontSize: 14, color: Colors.charcoal },
  journeyItem: { flexDirection: 'row', minHeight: 100 },
  journeyLineWrapper: { width: 30, alignItems: 'center' },
  journeyDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, zIndex: 10 },
  journeyLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 4 },
  journeyContent: { flex: 1, paddingLeft: 16, paddingBottom: 32 },
  journeyTime: { fontFamily: 'Outfit_900Black', fontSize: 11, color: Colors.primary, letterSpacing: 2, marginBottom: 4 },
  journeyTitle: { fontFamily: 'Outfit_900Black', fontSize: 18, color: Colors.charcoal, marginBottom: 8 },
  journeyDesc: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.slate[500], lineHeight: 22 },
  journeyImage: { width: '100%', height: 180, borderRadius: 20, marginVertical: 12, backgroundColor: Colors.slate[50] },
  footerBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 110, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
  footerInfo: { flex: 1 },
  footerPriceLabel: { fontFamily: 'Outfit_900Black', fontSize: 10, letterSpacing: 1.5, color: Colors.slate[400], textTransform: 'uppercase' },
  footerPriceVal: { fontFamily: 'Outfit_900Black', fontSize: 24, color: Colors.charcoal, letterSpacing: -0.5 },
  footerCta: { flex: 1.2, height: 64, backgroundColor: Colors.primary, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  footerCtaText: { color: Colors.white, fontFamily: 'Outfit_900Black', fontSize: 12, letterSpacing: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  avgRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avgRatingText: { fontFamily: 'Outfit_900Black', fontSize: 11, color: Colors.slate[400] },
  reviewCard: { backgroundColor: Colors.slate[50], padding: 20, borderRadius: 24, marginBottom: 16 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewUserIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  reviewUser: { fontFamily: 'Outfit_900Black', fontSize: 12, color: Colors.charcoal, textTransform: 'uppercase' },
  reviewComment: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.slate[500], fontStyle: 'italic', lineHeight: 22 },
  faqItem: { marginBottom: 24 },
  faqQuestion: { fontFamily: 'Outfit_900Black', fontSize: 15, color: Colors.charcoal, marginBottom: 8 },
  faqAnswer: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.slate[500], lineHeight: 22 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.slate[50], paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  amenityText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: Colors.charcoal },
  inclusionsCard: { backgroundColor: Colors.slate[50], padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Colors.border },
  inclusionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  inclusionText: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.charcoal, flex: 1 },
  policyCard: { flexDirection: 'row', gap: 12, backgroundColor: '#F0F9FF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#BAE6FD' },
  policyText: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: '#0369A1', flex: 1, lineHeight: 22 },
  highlightsCard: { backgroundColor: Colors.white, padding: 0 },
  highlightItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  highlightDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 8 },
  highlightText: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: Colors.charcoal, flex: 1, lineHeight: 22 },
  galleryContent: { paddingRight: 24, gap: 16 },
  galleryCard: { width: 280, height: 180, borderRadius: 24, overflow: 'hidden', backgroundColor: Colors.white },
  galleryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  policiesStack: { backgroundColor: '#F8FAFC', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: Colors.border },
  premiumPolicyItem: { flexDirection: 'row', gap: 16 },
  policyIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  policyContent: { flex: 1 },
  policyItemTitle: { fontFamily: 'Outfit_900Black', fontSize: 13, color: Colors.charcoal, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  policyItemText: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.slate[500], lineHeight: 22 },
  roomHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  mealPlanBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  mealPlanText: { fontFamily: 'Outfit_900Black', fontSize: 9, color: '#D97706' },
  occupancyRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  occupancyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  occupancyText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: Colors.slate[500] },
  roomDivider: { height: 1, backgroundColor: Colors.border, marginBottom: 16 },
  selectRoomBtn: { backgroundColor: Colors.charcoal, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  selectRoomBtnText: { color: Colors.white, fontFamily: 'Outfit_900Black', fontSize: 11, letterSpacing: 2 },
  roomFeaturesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.slate[50], paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, minWidth: '45%' },
  featureText: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, color: Colors.charcoal },
  variantPriceBadge: { position: 'absolute', top: 24, right: 24, backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  variantPriceLabel: { fontFamily: 'Outfit_900Black', fontSize: 8, color: Colors.slate[400], letterSpacing: 1 },
  variantPriceVal: { fontFamily: 'Outfit_900Black', fontSize: 13, color: Colors.charcoal },
});

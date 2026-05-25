import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Colors } from '../theme/colors';
import { MapPin, Sparkles, Clock, Wifi, Waves, Palmtree, Flower2, Plane } from 'lucide-react-native';
import { resolveImageUrl } from '../utils/imageUtils';
import { Image as ExpoImage } from 'expo-image';
import { StarRating } from './StarRating';
import { useSettings } from '../context/SettingsContext';

interface ServiceCardProps {
  name: string;
  image_url: string | null;
  price: number;
  category?: string;
  location?: string;
  onPress: () => void;
  fullWidth?: boolean;
  rating?: number;
  duration?: string;
  amenities?: string[] | string;
  meal_plans?: { label: string; price?: number }[] | string[];
  activity_type?: string;
  is_seasonal?: boolean;
  deal_note?: string;
  description?: string;
  short_description?: string;
}

export const ServiceCard = ({ 
  name, image_url, price, category, location, onPress, fullWidth,
  rating, duration, amenities, meal_plans, activity_type, is_seasonal, deal_note, description, short_description 
}: ServiceCardProps) => {
  const { width } = useWindowDimensions();
  const { generalConfig } = useSettings();
  const labels = generalConfig?.ui_labels || {};
  
  const CARD_WIDTH = fullWidth ? width - 48 : width * 0.82; // Slightly wider for better spec visibility

  return (
    <TouchableOpacity 
      style={[styles.container, { width: CARD_WIDTH }]} 
      onPress={onPress} 
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${name}, located in ${location || 'Mauritius'}. Price starts from Rs ${price?.toLocaleString() || '0'}.`}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Surface style={styles.card} elevation={0}>
        <View style={styles.imageContainer}>
          <ExpoImage 
            source={resolveImageUrl(image_url, 400, 300)} 
            style={styles.image}
            contentFit="cover"
            transition={300}
            cachePolicy="disk"
            accessibilityLabel={`Photo of ${name}`}
          />
          
          {/* Seasonal Badge Overlay */}
          {is_seasonal && (
            <View style={styles.seasonalBadge}>
              <Text style={styles.seasonalText}>{deal_note || labels.limited_time || 'LIMITED TIME'}</Text>
            </View>
          )}

          {/* Activity Badge Overlay */}
          {activity_type && (
            <View style={styles.activityOverlay}>
              {activity_type === 'Sea' && <Waves size={10} color={Colors.white} />}
              {activity_type === 'Land' && <Palmtree size={10} color={Colors.white} />}
              {activity_type === 'Air' && <Plane size={10} color={Colors.white} />}
              <Text style={styles.activityText}>{activity_type} ACTIVITIES</Text>
            </View>
          )}

          <View style={styles.priceTag}>
            <Text style={styles.priceLabel}>{labels.as_from || 'AS FROM'}</Text>
            <Text style={styles.priceValue}>
              Rs {price?.toLocaleString() || '0'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.category} accessibilityRole="header">{category || 'Experience'}</Text>
            <View style={styles.benefitBadge}>
              <Sparkles size={10} color="#92400E" />
              <Text style={styles.benefitText}>ELITE CHOICE</Text>
            </View>
          </View>
          
          <Text style={styles.name} numberOfLines={1}>{name}</Text>

          {(short_description || description) && (
            <Text style={styles.description} numberOfLines={2}>
              {(short_description || description || '').replace(/<[^>]*>?/gm, '')}
            </Text>
          )}

          <View style={styles.metaRow}>
            <StarRating rating={rating || 0} size={12} />
            {duration && (
              <View style={styles.durationRow}>
                <Clock size={12} color={Colors.slate[400]} />
                <Text style={styles.durationText}>{duration}</Text>
              </View>
            )}
          </View>

          {/* Amenities & Meal Plans Row */}
          <View style={styles.specsRow}>
             {/* Amenity Icons */}
             <View style={styles.amenitiesContainer}>
                {(() => {
                    const ams = Array.isArray(amenities) 
                        ? amenities 
                        : typeof amenities === 'string' 
                            ? amenities.split(',').map(a => a.trim().toLowerCase())
                            : [];
                    
                    const iconMap = [
                        { key: 'wifi', icon: <Wifi size={12} color={Colors.slate[400]} /> },
                        { key: 'pool', icon: <Waves size={12} color={Colors.slate[400]} /> },
                        { key: 'beach', icon: <Palmtree size={12} color={Colors.slate[400]} /> },
                        { key: 'spa', icon: <Flower2 size={12} color={Colors.slate[400]} /> }
                    ];

                    return iconMap.filter(item => ams.some(a => a.includes(item.key))).slice(0, 3).map((item, idx) => (
                        <View key={idx} style={styles.amenityIcon}>
                            {item.icon}
                        </View>
                    ));
                })()}
             </View>

             {/* Meal Plan Badges */}
             <View style={styles.mealPlansRow}>
                {Array.isArray(meal_plans) && meal_plans.slice(0, 2).map((mp: any, idx) => (
                    <View key={idx} style={styles.mealBadge}>
                        <Text style={styles.mealText}>{typeof mp === 'string' ? mp : mp.label}</Text>
                    </View>
                ))}
             </View>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.locationRow}>
              <MapPin size={12} color={Colors.slate[600]} />
              <Text style={styles.location} numberOfLines={1}>{location || 'Mauritius'}</Text>
            </View>
            <View style={styles.bookAction}>
              <Text style={styles.bookText}>{labels.discover || 'DISCOVER'}</Text>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 20,
    marginBottom: 10,
  },
  card: {
    borderRadius: 32,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  priceLabel: {
    fontFamily: 'Outfit_900Black',
    fontSize: 8,
    color: Colors.slate[400],
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  priceValue: {
    fontFamily: 'Outfit_900Black',
    fontSize: 16,
    color: Colors.primary,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  category: {
    fontFamily: 'Outfit_900Black',
    fontSize: 9,
    color: Colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  benefitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  benefitText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 8,
    color: '#D97706',
    letterSpacing: 1,
  },
  name: {
    fontFamily: 'Outfit_900Black',
    fontSize: 18,
    color: Colors.charcoal,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    color: Colors.slate[500],
    lineHeight: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 10,
    color: Colors.slate[400],
    textTransform: 'uppercase',
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.slate[50],
  },
  amenitiesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  amenityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.slate[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealPlansRow: {
    flexDirection: 'row',
    gap: 4,
  },
  mealBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  mealText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 8,
    color: '#166534',
    textTransform: 'uppercase',
  },
  seasonalBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  seasonalText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 8,
    color: Colors.white,
    letterSpacing: 1,
  },
  activityOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  activityText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 8,
    color: Colors.white,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  location: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: Colors.slate[400],
  },
  bookAction: {
    backgroundColor: Colors.slate[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bookText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 10,
    color: Colors.charcoal,
    letterSpacing: 1,
  },
});

import React from 'react';
import { View, StyleSheet, useWindowDimensions, Image, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  SharedValue
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { HeroSlide } from '../hooks/useHomeData';
import { PremiumCarousel } from './PremiumCarousel';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { resolveImageUrl } from '../utils/imageUtils';
import { useSettings } from '../context/SettingsContext';

const ITEM_HEIGHT = 480;

type HeroSlideItemProps = {
  item: HeroSlide;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
};



const HeroSlideItem = ({ item, index, scrollX, width }: HeroSlideItemProps) => {
  const animatedImageStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, input, [1.2, 1, 1.2], Extrapolate.CLAMP);
    const translateX = interpolate(scrollX.value, input, [-width * 0.2, 0, width * 0.2], Extrapolate.CLAMP);
    return {
      transform: [{ scale }, { translateX }],
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, input, [0, 1, 0], Extrapolate.CLAMP);
    const translateY = interpolate(scrollX.value, input, [20, 0, 20], Extrapolate.CLAMP);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const router = useRouter();
  const { generalConfig } = useSettings();
  const labels = generalConfig?.ui_labels || {};

  const mapRoute = (link: string) => {
    if (!link) return '/explore';
    
    // Exact matches
    if (link === '/search') return '/explore';
    if (link === '/hotels') return { pathname: '/explore', params: { category: 'hotels' } };
    if (link === '/activities') return { pathname: '/explore', params: { category: 'activities' } };
    if (link === '/cruises') return { pathname: '/explore', params: { category: 'cruises' } };
    if (link === '/flights') return '/flights';
    
    // Default fallback
    return link;
  };

  const handlePress = () => {
    if (!item.cta_link) return;
    
    // Handle external links
    if (item.cta_link.startsWith('http')) {
      Linking.openURL(item.cta_link!);
      return;
    }

    const route = mapRoute(item.cta_link);
    router.push(route as any);
  };

  const handleSecondaryPress = () => {
    router.push('/tailormade');
  };

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.imageContainer}>
        <Animated.Image 
          source={resolveImageUrl(item.image_url)} 
          style={[styles.image, animatedImageStyle]} 
        />
      </View>
      <View style={styles.overlay} />
      <Animated.View style={[styles.content, animatedContentStyle]}>
        <Text variant="labelMedium" style={[styles.tag, item.badge_color ? { backgroundColor: item.badge_color + '33', borderColor: item.badge_color + '66' } : null]}>
          {item.badge_text || labels.hero_default_tag || 'Exclusive Collection'}
        </Text>
        <Text variant="displaySmall" style={styles.title}>{item.title}</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>{item.subtitle}</Text>
        
        {/* Pricing Badge Overlay (Premium WOW Factor) */}
        {(item as any).starting_price && (
          <View style={styles.priceOverlay}>
             <Text style={styles.priceOverlayLabel}>{labels.as_from || 'AS FROM'}</Text>
             <Text style={styles.priceOverlayValue}>Rs {(item as any).starting_price.toLocaleString()}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          {item.cta_text && (
            <TouchableOpacity 
              style={styles.cta} 
              activeOpacity={0.8}
              onPress={handlePress}
            >
              <Text variant="labelLarge" style={styles.ctaText}>{item.cta_text || labels.hero_default_cta || 'EXPLORE'}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.secondaryCta} 
            activeOpacity={0.8}
            onPress={handleSecondaryPress}
          >
            <Text variant="labelLarge" style={styles.secondaryCtaText}>{labels.hero_secondary_cta || 'DISCOVER'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

type HeroCarouselProps = {
  data: HeroSlide[];
};

export const HeroCarousel = ({ data }: HeroCarouselProps) => {
  const { width } = useWindowDimensions();
  if (!data || data.length === 0 || width === 0) return null;

  return (
    <View style={styles.container}>
      <PremiumCarousel
        data={data}
        itemWidth={width}
        gap={0}
        showIndicators={true}
        indicatorColor={Colors.primary}
        renderItem={({ item, index, scrollX }) => (
          <HeroSlideItem item={item} index={index} scrollX={scrollX} width={width} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT + 40, // Space for indicators
    backgroundColor: Colors.charcoal,
  },
  slide: {
    height: ITEM_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    marginTop: 60,
  },
  tag: {
    color: Colors.white,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38, 0.4)',
  },
  title: {
    color: Colors.white,
    fontWeight: '900',
    marginBottom: 12,
    lineHeight: 46,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 40,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cta: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    color: Colors.white,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  secondaryCta: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryCtaText: {
    color: Colors.white,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  priceOverlay: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  priceOverlayLabel: {
    fontFamily: 'Outfit_900Black',
    fontSize: 8,
    color: Colors.slate[400],
    letterSpacing: 2,
    marginBottom: 2,
  },
  priceOverlayValue: {
    fontFamily: 'Outfit_900Black',
    fontSize: 18,
    color: Colors.primary,
  },
});

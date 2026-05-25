import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { HeroSlide } from '../hooks/useHomeData';
import { resolveImageUrl } from '../utils/imageUtils';

const { width } = Dimensions.get('window');

export default function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    async function loadHeroSlides() {
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('*')
          .order('order_index', { ascending: true });

        if (error) throw error;
        setSlides(data || []);
      } catch (err) {
        console.error('Error fetching hero slides:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHeroSlides();
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveSlide(slideIndex);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (slides.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <Image
              source={resolveImageUrl(slide.image_url)}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.overlay} />
            
            <View style={styles.content}>
              <Text style={styles.tag} accessibilityRole="header">TRAVEL DEALS</Text>
              <Text style={styles.title} accessibilityRole="header">{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
              
              <View style={styles.buttonRow}>
                <Button 
                  mode="contained" 
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  accessibilityLabel={`Discover more about ${slide.title}`}
                  accessibilityRole="button"
                >
                  DISCOVER MORE
                </Button>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination} importantForAccessibility="no-hide-descendants">
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === activeSlide ? theme.colors.primary : 'rgba(255,255,255,0.4)' },
              i === activeSlide && styles.activeDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 500, // Increased height for better spacing
    backgroundColor: '#0F172A',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    width,
    height: 500,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)', // Darker for better contrast
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tag: {
    color: '#FFFFFF',
    fontSize: 12, // Increased
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42, // Increased
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 16,
  },
  subtitle: {
    color: '#F8FAFC', // Near white for high contrast
    fontSize: 18, // Increased
    fontWeight: '600', // Increased
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 36,
    maxWidth: 320,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  button: {
    borderRadius: 100,
    backgroundColor: '#DC2626', // Use Brand Red for visibility
    minWidth: 200, // Ensure good touch target width
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 12, // Larger touch target
    paddingHorizontal: 24,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  pagination: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
  },
});

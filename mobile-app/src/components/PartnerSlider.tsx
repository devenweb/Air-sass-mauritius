import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Colors } from '../theme/colors';

const PARTNERS = [
  { name: 'Air Austral', logo: require('../../assets/partners/airaustral.png') },
  { name: 'Air France', logo: require('../../assets/partners/airfrance.png') },
  { name: 'Air Mauritius', logo: require('../../assets/partners/airmauritius.png') },
  { name: 'Expat', logo: require('../../assets/partners/expatlogo.jpg') },
  { name: 'Holy', logo: require('../../assets/partners/holynew.png') },
  { name: 'Kenya Airways', logo: require('../../assets/partners/kenyaairways.png') },
  { name: 'SA Airways', logo: require('../../assets/partners/saairways.png') },
  { name: 'Swan', logo: require('../../assets/partners/swannew.png') },
  { name: 'Turkish Airlines', logo: require('../../assets/partners/turkishairline.png') },
  { name: 'Hotelbeds', logo: require('../../assets/partners/hotelbeds.png') },
  { name: 'TBO Holidays', logo: require('../../assets/partners/tboholidays.png') },
  { name: 'Emirates', logo: require('../../assets/partners/prt5.webp') }, 
  { name: 'Cim Finance', logo: require('../../assets/partners/prt7.webp') },
  { name: 'Partner 3', logo: require('../../assets/partners/prt3.webp') },
];

export const PartnerSlider = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const contentWidth = useRef(0);

  useEffect(() => {
    const scroll = () => {
      scrollX.current += 1;
      if (contentWidth.current > 0 && scrollX.current >= contentWidth.current / 3) {
        scrollX.current = 0;
      }
      scrollViewRef.current?.scrollTo({ x: scrollX.current, animated: false });
    };

    const interval = setInterval(scroll, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onContentSizeChange={(width) => {
          contentWidth.current = width;
        }}
        contentContainerStyle={styles.scrollContent}
      >
        {[...PARTNERS, ...PARTNERS, ...PARTNERS].map((partner, index) => (
          <View key={`${partner.name}-${index}`} style={styles.logoContainer}>
            <Image source={partner.logo} style={styles.logo} resizeMode="contain" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    backgroundColor: Colors.surface,
    marginBottom: 20,
  },
  scrollContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 50,
    marginHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../theme/colors';
import { resolveImageUrl } from '../utils/imageUtils';
import { Image as ExpoImage } from 'expo-image';

interface CategoryCardProps {
  name: string;
  slug: string;
  image_url: string | null;
  onPress: () => void;
}

export const CategoryCard = ({ name, slug, image_url, onPress }: CategoryCardProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <ExpoImage 
        source={resolveImageUrl(image_url, 300, 450)} 
        style={styles.image}
        contentFit="cover"
        transition={300}
        cachePolicy="disk"
      />
      <View style={styles.overlay}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.indicator} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 156,
    height: 240,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: Colors.slate[50],
    marginRight: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  name: {
    color: Colors.white,
    fontFamily: 'Outfit_900Black',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  indicator: {
    width: 24,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});

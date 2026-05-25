import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
  maxStars?: number;
}

export const StarRating = ({ 
  rating, 
  size = 16, 
  color = '#F59E0B', 
  maxStars = 5 
}: StarRatingProps) => {
  return (
    <View style={styles.container}>
      {[...Array(maxStars)].map((_, i) => {
        const isFull = i < Math.floor(rating);
        const isHalf = !isFull && i < rating;
        
        return (
          <Star
            key={i}
            size={size}
            color={isFull || isHalf ? color : '#E2E8F0'}
            fill={isFull ? color : isHalf ? color : 'transparent'}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
});

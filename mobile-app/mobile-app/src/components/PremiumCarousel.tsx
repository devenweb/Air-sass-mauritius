import React from 'react';
import { View, StyleSheet, useWindowDimensions, FlatList } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate 
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

interface IndicatorProps {
  index: number;
  itemWidth: number;
  scrollX: Animated.SharedValue<number>;
  indicatorColor: string;
}

const RenderIndicator = ({ index, itemWidth, scrollX, indicatorColor }: IndicatorProps) => {
  const indicatorStyle = useAnimatedStyle(() => {
    const input = [(index - 1) * itemWidth, index * itemWidth, (index + 1) * itemWidth];
    const dotWidth = interpolate(scrollX.value, input, [8, 24, 8], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, input, [0.3, 1, 0.3], Extrapolate.CLAMP);
    return { width: dotWidth, opacity };
  });

  return (
    <Animated.View 
      style={[
        styles.dot, 
        { backgroundColor: indicatorColor }, 
        indicatorStyle
      ]} 
    />
  );
};

interface PremiumCarouselProps<T> {
  data: T[];
  renderItem: (info: { item: T; index: number; scrollX: Animated.SharedValue<number> }) => React.ReactElement;
  itemWidth?: number;
  gap?: number;
  showIndicators?: boolean;
  indicatorColor?: string;
  onItemPress?: (item: T) => void;
}

export function PremiumCarousel<T>({ 
  data, 
  renderItem, 
  itemWidth: providedItemWidth, 
  gap = 0,
  showIndicators = true,
  indicatorColor = Colors.primary
}: PremiumCarouselProps<T>) {
  const { width } = useWindowDimensions();
  const itemWidth = providedItemWidth || width;
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={data}
        horizontal
        pagingEnabled={itemWidth === width}
        snapToInterval={itemWidth + gap}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: (width - itemWidth) / 2 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => renderItem({ item, index, scrollX })}
      />
      
      {showIndicators && (
        <View style={styles.indicatorContainer}>
          {data.map((_, index) => (
            <RenderIndicator 
              key={index} 
              index={index} 
              itemWidth={itemWidth} 
              scrollX={scrollX} 
              indicatorColor={indicatorColor} 
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

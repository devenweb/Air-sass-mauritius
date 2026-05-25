import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Svg, { Path, G, Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface InteractiveMapProps {
  onSelectRegion: (region: string) => void;
  selectedRegion?: string;
}

const regions = [
  {
    id: 'north',
    name: 'North Coast',
    label: 'The North',
    description: 'Grand Baie, Pereybere',
    path: "M 48 2 L 60 5 L 82 18 L 88 38 L 75 48 L 52 42 L 40 28 L 48 2 Z",
    color: "#EF4444",
  },
  {
    id: 'east',
    name: 'East Coast',
    label: 'The East',
    description: 'Belle Mare, Post-Lafayette',
    path: "M 88 38 L 98 55 L 90 78 L 78 85 L 70 55 L 75 48 L 88 38 Z",
    color: "#3B82F6",
  },
  {
    id: 'south',
    name: 'South Coast',
    label: 'The South',
    description: 'Bel Ombre, Le Morne',
    path: "M 78 85 L 65 98 L 35 98 L 22 88 L 48 72 L 68 68 Z",
    color: "#10B981",
  },
  {
    id: 'west',
    name: 'West Coast',
    label: 'The West',
    description: 'Flic en Flac, Tamarin',
    path: "M 40 28 L 52 42 L 52 65 L 48 72 L 22 88 L 12 70 L 18 45 L 40 28 Z",
    color: "#F59E0B",
  },
  {
    id: 'central',
    name: 'Central',
    label: 'Central',
    description: 'Moka, Curepipe',
    path: "M 52 42 L 75 48 L 70 55 L 78 85 L 48 72 L 52 65 L 52 42 Z",
    color: "#64748B",
  }
];

const centers: Record<string, {x: number, y: number}> = {
  north: { x: 62, y: 20 },
  east: { x: 82, y: 56 },
  south: { x: 50, y: 88 },
  west: { x: 28, y: 60 },
  central: { x: 62, y: 62 }
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ onSelectRegion, selectedRegion }) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <View style={styles.glow} />
        <Svg viewBox="0 0 110 110" style={styles.svg}>
          {/* Ghost Outline */}
          <Path 
            d="M 48 2 L 60 5 L 82 18 L 88 38 L 98 55 L 90 78 L 78 85 L 65 98 L 35 98 L 22 88 L 12 70 L 18 45 L 40 28 L 48 2 Z"
            fill="rgba(241, 245, 249, 0.5)"
            stroke={Colors.slate[200]}
            strokeWidth="0.5"
          />

          {regions.map((region) => {
            const isSelected = selectedRegion?.toLowerCase() === region.name.toLowerCase();
            const center = centers[region.id];
            
            return (
              <G key={region.id} onPress={() => onSelectRegion(region.name)}>
                <Path
                  d={region.path}
                  fill={isSelected ? `${region.color}80` : 'transparent'}
                  stroke={isSelected ? region.color : Colors.white}
                  strokeWidth={isSelected ? "1" : "0.5"}
                />
                <Circle
                  cx={center.x}
                  cy={center.y}
                  r={isSelected ? 2 : 1}
                  fill={isSelected ? Colors.primary : Colors.slate[400]}
                />
                {isSelected && (
                  <SvgText
                    x={center.x}
                    y={center.y - 6}
                    textAnchor="middle"
                    fontSize="4"
                    fontWeight="900"
                    fill={Colors.charcoal}
                    letterSpacing="0.5"
                  >
                    {region.label.toUpperCase()}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      </View>

      <View style={styles.list}>
        {regions.map((region) => {
          const isSelected = selectedRegion?.toLowerCase() === region.name.toLowerCase();
          return (
            <TouchableOpacity
              key={region.id}
              style={[styles.regionBtn, isSelected && styles.regionBtnActive]}
              onPress={() => onSelectRegion(region.name)}
            >
              <View style={styles.regionInfo}>
                <Text style={[styles.regionLabel, isSelected && styles.regionLabelActive]}>
                  {region.label}
                </Text>
                <Text style={[styles.regionDesc, isSelected && styles.regionDescActive]}>
                  {region.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  mapWrapper: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    marginBottom: 24,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 200,
  },
  svg: {
    width: '100%',
    height: '100%',
  },
  list: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionBtn: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  regionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  regionInfo: {
    gap: 2,
  },
  regionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.charcoal,
    letterSpacing: 1,
  },
  regionLabelActive: {
    color: '#fff',
  },
  regionDesc: {
    fontSize: 8,
    fontWeight: '600',
    color: Colors.slate[400],
  },
  regionDescActive: {
    color: 'rgba(255,255,255,0.7)',
  }
});

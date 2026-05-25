import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

type PremiumCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  [key: string]: any;
};

export default function PremiumCard({ children, style, onPress, ...props }: PremiumCardProps) {
  const theme = useTheme();

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        style
      ]}
      onPress={onPress}
      {...props}
    >
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 24,
    // Premium shadow logic
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)', 
    overflow: 'hidden',
  },
});

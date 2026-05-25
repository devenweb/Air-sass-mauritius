import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Colors } from './colors';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    secondary: Colors.charcoal,
    error: Colors.error,
    background: Colors.background,
    surface: Colors.surface,
    outline: Colors.border,
  },
  // Use default fonts or configure properly for MD3
  fonts: configureFonts({}),
};

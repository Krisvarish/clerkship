export const Colors = {
  // Calm Kit Core Palette
  ivory: '#F4EFE8',           // Global Background
  background: '#F4EFE8',
  card: '#FAF7F2',             // Elevated Card Surface
  cardElevated: '#FAF7F2',
  sage: '#6B7F6E',             // Primary Accent / Active / Present
  primary: '#6B7F6E',
  moss: '#A7B8A7',             // Secondary Accent
  secondary: '#A7B8A7',
  mist: '#D9E1D9',             // Secondary Surface / Track / Cancelled
  sand: '#C9BDAF',             // Muted Text / Inactive / Borders
  border: '#E3DDD4',           // Soft border
  borderLight: '#ECE6DC',
  terracotta: '#C87A65',       // Absent / Alert
  absent: '#C87A65',
  alert: '#C87A65',

  // Typography Colors
  textPrimary: '#2C352E',      // Primary Text
  textSecondary: '#5C665E',    // Secondary Text
  textMuted: '#8E998F',        // Muted helper text
  textInverse: '#FAF7F2',      // Text on dark pill

  // Utilities
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(44, 53, 46, 0.4)',
};

export const Shadows = {
  card: {
    shadowColor: '#2C352E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  subtle: {
    shadowColor: '#2C352E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  float: {
    shadowColor: '#2C352E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
};

export default Colors;

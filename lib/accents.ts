// Accent palette: per-feature icon-tile colors for a colorful, MyGate-style UI.
// Brand olive stays the primary; accents are used only on icon chips/badges.
export const ACCENTS = {
  primary: '#3E481D',
  blue: '#2563EB',
  teal: '#0D9488',
  green: '#16A34A',
  amber: '#D97706',
  red: '#DC2626',
  purple: '#7C3AED',
  pink: '#DB2777',
  indigo: '#4F46E5',
  slate: '#475569',
} as const;

// A soft translucent tint of an accent for icon-chip backgrounds.
export const tint = (hex: string) => `${hex}22`;

// Design tokens: raw palette plus semantic light/dark themes and scales.
export const palette = {
  // Brand greens and neutrals sourced from plan.md §3.1.
  fern: '#3E481D',
  sage: '#C0CBA9',
  ink: '#1B1C15',
  paper: '#FCFDF3',
  mist: '#E2E3DA',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };
export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

// Semantic color sets consumed by useTheme for non-Tailwind contexts.
export const lightTheme = {
  primary: palette.fern,
  muted: palette.ink,
  mutedOpacity: 0.1,
  background: palette.paper,
  foreground: palette.ink,
};

export const darkTheme = {
  primary: palette.sage,
  muted: palette.mist,
  mutedOpacity: 0.2,
  background: palette.ink,
  foreground: palette.mist,
};

export type Theme = typeof lightTheme;

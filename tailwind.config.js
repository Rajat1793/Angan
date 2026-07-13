/** Tailwind config — Angan design tokens driven by CSS vars for light/dark. */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Semantic tokens resolve to rgb() vars so opacity utilities work.
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
      },
      borderRadius: { xl: '16px', '2xl': '20px' },
    },
  },
  plugins: [],
};

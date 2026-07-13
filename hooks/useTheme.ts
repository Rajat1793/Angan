// useTheme: resolves active scheme and returns the matching token set.
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme } from '@/lib/theme';
import { useThemeStore } from '@/store/theme.store';

export function useTheme() {
  const system = useColorScheme();
  const scheme = useThemeStore((s) => s.scheme);
  // Explicit user choice wins; otherwise fall back to the OS setting.
  const isDark = scheme === 'system' ? system === 'dark' : scheme === 'dark';
  return { isDark, colors: isDark ? darkTheme : lightTheme };
}

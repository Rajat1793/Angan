// Typo: the app's typography scale — one Text component with semantic variants.
// display > title > heading > body > label > caption.
import { Text as RNText, type TextProps } from 'react-native';

export type TypoVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption';

const variants: Record<TypoVariant, string> = {
  display: 'text-3xl font-extrabold text-foreground',
  title: 'text-2xl font-bold text-foreground',
  heading: 'text-lg font-semibold text-foreground',
  body: 'text-base text-foreground',
  label: 'text-sm font-medium text-foreground',
  caption: 'text-xs text-foreground/60',
};

interface TypoProps extends TextProps {
  variant?: TypoVariant;
  className?: string;
}

export function Typo({ variant = 'body', className = '', ...props }: TypoProps) {
  return <RNText className={`${variants[variant]} ${className}`} {...props} />;
}

// Avatar: circular initials badge with a deterministic color derived from the name.
import { Text, View } from 'react-native';

import { ACCENTS, tint } from '@/lib/accents';

const PALETTE = [
  ACCENTS.blue,
  ACCENTS.teal,
  ACCENTS.green,
  ACCENTS.amber,
  ACCENTS.red,
  ACCENTS.purple,
  ACCENTS.pink,
  ACCENTS.indigo,
  ACCENTS.slate,
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// A stable index into the palette based on the name's characters.
function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface AvatarProps {
  name?: string | null;
  size?: number;
}

export function Avatar({ name, size = 40 }: AvatarProps) {
  const label = name?.trim() || '';
  const color = colorFor(label || '?');
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: tint(color) }}
    >
      <Text style={{ color, fontSize: size * 0.4, fontWeight: '700' }}>
        {initials(label || '?')}
      </Text>
    </View>
  );
}

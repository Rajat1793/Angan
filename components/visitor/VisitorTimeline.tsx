// VisitorTimeline: a vertical status tracker (requested → approved → entered → exited).
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ACCENTS } from '@/lib/accents';
import type { Visitor } from '@/lib/database.types';

const fmt = (t: string | null) =>
  t
    ? new Date(t).toLocaleString([], {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

interface Step {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  time: string | null;
  done: boolean;
  color: string;
}

export function VisitorTimeline({ visitor }: { visitor: Visitor }) {
  const denied = visitor.status === 'denied';
  const approved = ['approved', 'inside', 'exited'].includes(visitor.status);

  const steps: Step[] = denied
    ? [
        {
          label: 'Requested',
          icon: 'add-circle',
          time: fmt(visitor.created_at),
          done: true,
          color: ACCENTS.slate,
        },
        { label: 'Denied', icon: 'close-circle', time: null, done: true, color: ACCENTS.red },
      ]
    : [
        {
          label: 'Requested',
          icon: 'add-circle',
          time: fmt(visitor.created_at),
          done: true,
          color: ACCENTS.slate,
        },
        {
          label: 'Approved',
          icon: 'checkmark-circle',
          time: null,
          done: approved,
          color: ACCENTS.green,
        },
        {
          label: 'Entered',
          icon: 'log-in',
          time: fmt(visitor.entry_at),
          done: !!visitor.entry_at,
          color: ACCENTS.blue,
        },
        {
          label: 'Exited',
          icon: 'log-out',
          time: fmt(visitor.exit_at),
          done: !!visitor.exit_at,
          color: ACCENTS.slate,
        },
      ];

  return (
    <View className="mt-2">
      {steps.map((s, i) => (
        <View key={s.label} className="flex-row gap-3">
          <View className="items-center">
            <View
              className="h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: s.done ? s.color : 'rgba(120,120,120,0.15)' }}
            >
              <Ionicons name={s.icon} size={16} color={s.done ? '#fff' : '#9ca3af'} />
            </View>
            {i < steps.length - 1 ? (
              <View
                className="my-1 w-0.5 flex-1"
                style={{
                  backgroundColor: s.done ? s.color : 'rgba(120,120,120,0.2)',
                  minHeight: 18,
                }}
              />
            ) : null}
          </View>
          <View className="flex-1 pb-3">
            <Text
              className={`text-sm font-semibold ${s.done ? 'text-foreground' : 'text-foreground/40'}`}
            >
              {s.label}
            </Text>
            <Text className="text-xs text-foreground/50">
              {s.time ?? (s.done ? 'Done' : 'Pending')}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// StatStrip: a primary-colored overview card showing several labelled stats.
import { Text, View } from 'react-native';

export interface Stat {
  label: string;
  value: string | number;
}

export function StatStrip({ title, stats }: { title?: string; stats: Stat[] }) {
  return (
    <View className="rounded-2xl bg-primary p-4 shadow-sm">
      {title ? (
        <Text className="mb-3 text-xs font-medium uppercase tracking-wide text-background/70">
          {title}
        </Text>
      ) : null}
      <View className="flex-row">
        {stats.map((s, i) => (
          <View
            key={s.label}
            className={`flex-1 items-center ${i > 0 ? 'border-l border-background/20' : ''}`}
          >
            <Text className="text-2xl font-bold text-background">{s.value}</Text>
            <Text className="mt-0.5 text-xs text-background/70">{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

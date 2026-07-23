// Resident services hub: entry point to all society services.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { ListRow } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { ACCENTS } from '@/lib/accents';

interface Service {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  path: string;
}

const SERVICES: Service[] = [
  { icon: 'warning', title: 'Emergency SOS', subtitle: 'Alert guards & admin instantly', color: ACCENTS.red, path: '/(resident)/sos' },
  { icon: 'people', title: 'Frequent visitors', subtitle: 'Save regulars for quick entry', color: ACCENTS.blue, path: '/(resident)/frequent' },
  { icon: 'car-sport', title: 'My vehicles', subtitle: 'Register cars & bikes', color: ACCENTS.slate, path: '/(resident)/vehicles' },
  { icon: 'cube', title: 'Deliveries', subtitle: 'Parcels waiting at the gate', color: ACCENTS.amber, path: '/(resident)/deliveries' },
  { icon: 'book', title: 'Directory', subtitle: 'Neighbours & committee', color: ACCENTS.teal, path: '/(resident)/directory' },
  { icon: 'document-text', title: 'Documents', subtitle: 'Society files & receipts', color: ACCENTS.indigo, path: '/(resident)/documents' },
  { icon: 'calendar', title: 'Events', subtitle: 'Upcoming community events', color: ACCENTS.pink, path: '/(resident)/events' },
  { icon: 'pricetags', title: 'Marketplace', subtitle: 'Buy, sell & recommend', color: ACCENTS.green, path: '/(resident)/marketplace' },
  { icon: 'swap-horizontal', title: 'Move in / out', subtitle: 'Request a move', color: ACCENTS.purple, path: '/(resident)/move' },
];

export default function Services() {
  return (
    <ScreenScaffold title="Services" showBack>
      <ScrollView contentContainerClassName="gap-3 p-5">
        <Text className="text-sm text-foreground/50">Everything your society offers, in one place.</Text>
        {SERVICES.map((s) => (
          <ListRow
            key={s.path}
            icon={s.icon}
            title={s.title}
            subtitle={s.subtitle}
            color={s.color}
            onPress={() => router.push(s.path as never)}
          />
        ))}
      </ScrollView>
    </ScreenScaffold>
  );
}

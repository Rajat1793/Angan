// Guard tab group; concrete tabs are defined in Phase 2.
import { Stack } from 'expo-router';

export default function GuardLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

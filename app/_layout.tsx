// Root navigation layout: hosts all route groups behind a headerless stack.
import { Stack } from 'expo-router';

export default function RootLayout() {
  // Route groups (auth/resident/guard/admin) are swapped by the auth guard later.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(resident)" />
      <Stack.Screen name="(guard)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

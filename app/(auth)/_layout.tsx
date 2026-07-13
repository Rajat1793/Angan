// Auth route group: stack for login, OTP, and onboarding screens.
import { Stack } from 'expo-router';

export default function AuthLayout() {
  // Simple headerless stack; screens are added across Phase 2.
  return <Stack screenOptions={{ headerShown: false }} />;
}

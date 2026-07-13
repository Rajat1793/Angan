// App entry: sends users to the auth group until session-based routing lands.
import { Redirect } from 'expo-router';

export default function Index() {
  // Temporary landing redirect; replaced by role-aware routing in Phase 2.
  return <Redirect href="/(auth)/login" />;
}

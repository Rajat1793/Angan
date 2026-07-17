// ConfigNotice: shown when Supabase env vars are missing so the app never blanks.
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ConfigNotice() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-3 px-6">
        <Text className="text-2xl font-bold text-primary">Angan</Text>
        <Text className="text-base font-semibold text-foreground">
          Supabase isn’t configured yet
        </Text>
        <Text className="text-sm text-foreground/70">
          Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and
          EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server with
          {'\n'}npx expo start -c
        </Text>
      </View>
    </SafeAreaView>
  );
}

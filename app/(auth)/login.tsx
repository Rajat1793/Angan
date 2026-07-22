// Welcome + login screen: branded olive hero, email/password sign-in, and
// one-tap demo logins.
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input, useToast } from '@/components/ui';
import { signInWithPassword } from '@/lib/auth';
import { loginSchema, type LoginInput } from '@/lib/validation';

// Seeded demo accounts (all share the password below). Each resident lives in
// a different flat so guard/resident flows can be tested across flats.
const DEMO_PASSWORD = 'Demo@1234';
const DEMO_ACCOUNTS = [
  { label: 'Guard', email: 'guard@angan.app' },
  { label: 'Admin', email: 'admin@angan.app' },
  { label: 'Riya · A-101', email: 'resident@angan.app' },
  { label: 'Vikram · A-102', email: 'resident2@angan.app' },
  { label: 'Neha · A-201', email: 'resident3@angan.app' },
  { label: 'Arjun · B-101', email: 'resident4@angan.app' },
  { label: 'Priya · B-102', email: 'resident5@angan.app' },
  { label: 'Rohan · B-201', email: 'resident6@angan.app' },
  { label: 'Sara · C-101', email: 'resident7@angan.app' },
  { label: 'Kabir · C-102', email: 'resident8@angan.app' },
  { label: 'Ananya · C-201', email: 'resident9@angan.app' },
  { label: 'Dev · D-101', email: 'resident10@angan.app' },
];

export default function Login() {
  const [loading, setLoading] = useState(false);
  const toast = useToast((s) => s.show);
  const { control, handleSubmit, setValue, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Password sign-in; the auth listener handles routing afterwards.
  const onSubmit = async (values: LoginInput) => {
    setLoading(true);
    try {
      await signInWithPassword(values.email, values.password);
    } catch (e) {
      toast((e as Error).message ?? 'Sign-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fill + sign in as a seeded demo account in one tap.
  const quickLogin = async (email: string) => {
    setValue('email', email);
    setValue('password', DEMO_PASSWORD);
    await onSubmit({ email, password: DEMO_PASSWORD });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-6 px-6 pb-10" showsVerticalScrollIndicator={false}>
        {/* Branded hero. */}
        <View className="items-center gap-3 rounded-b-[36px] bg-primary/10 pb-6 pt-8">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-sm">
            <Ionicons name="home" size={40} color="#FCFDF3" />
          </View>
          <View className="items-center">
            <Text className="text-3xl font-bold text-primary">Angan</Text>
            <Text className="text-sm font-medium text-foreground/50">The Modern Courtyard</Text>
          </View>
        </View>

        {/* Welcome copy. */}
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Welcome Home.</Text>
          <Text className="text-base leading-6 text-foreground/60">
            The conversations that used to happen at the gate, now happen inside. Securely.
            Effortlessly.
          </Text>
        </View>

        {/* Sign-in form. */}
        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                error={formState.errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={formState.errors.password?.message}
              />
            )}
          />

          {/* Primary CTA. */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            className={`h-12 flex-row items-center justify-center rounded-xl bg-primary px-4 ${loading ? 'opacity-60' : 'active:opacity-80'}`}
          >
            {loading ? (
              <ActivityIndicator color="#FCFDF3" />
            ) : (
              <Text className="text-base font-semibold text-background">Login as Resident</Text>
            )}
          </Pressable>
        </View>

        {/* Quick demo logins — each resident is in a different flat. */}
        <View className="gap-2">
          <Text className="text-xs font-medium uppercase tracking-wide text-foreground/40">
            Demo accounts
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pr-4"
          >
            {DEMO_ACCOUNTS.map((a) => (
              <Pressable
                key={a.email}
                onPress={() => quickLogin(a.email)}
                disabled={loading}
                className="rounded-full border border-muted/20 bg-muted/10 px-3 py-2 active:opacity-60"
              >
                <Text className="text-xs font-medium text-foreground">{a.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Terms footer. */}
        <Text className="text-center text-xs text-foreground/40">
          By continuing, you agree to our Terms &amp; Conditions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

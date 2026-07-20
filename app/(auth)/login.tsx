// Login screen: email/password sign-in with an email-OTP alternative.
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, useToast } from '@/components/ui';
import { requestEmailOtp, signInWithPassword } from '@/lib/auth';
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
  const { control, handleSubmit, getValues, setValue, formState } = useForm<LoginInput>({
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

  // Request an email OTP and jump to the code-entry screen.
  const onEmailOtp = async () => {
    const email = getValues('email');
    if (!email) return toast('Enter your email first', 'info');
    try {
      await requestEmailOtp(email);
      router.push({ pathname: '/(auth)/otp', params: { email } });
    } catch (e) {
      toast((e as Error).message ?? 'Could not send code', 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-5 px-6">
        <View className="gap-1">
          <Text className="text-3xl font-bold text-primary">Angan</Text>
          <Text className="text-base text-foreground/60">
            Your society, in one place.
          </Text>
        </View>

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

        <Button label="Sign in" loading={loading} onPress={handleSubmit(onSubmit)} />
        <Pressable onPress={onEmailOtp} className="items-center py-2">
          <Text className="text-sm font-medium text-primary">
            Use email OTP instead
          </Text>
        </Pressable>

        {/* Quick demo logins — each resident is in a different flat. */}
        <View className="gap-2 pt-2">
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
      </View>
    </SafeAreaView>
  );
}

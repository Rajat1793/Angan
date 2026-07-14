// Login screen: email/password sign-in with an email-OTP alternative.
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, useToast } from '@/components/ui';
import { requestEmailOtp, signInWithPassword } from '@/lib/auth';
import { loginSchema, type LoginInput } from '@/lib/validation';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const toast = useToast((s) => s.show);
  const { control, handleSubmit, getValues, formState } = useForm<LoginInput>({
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
      </View>
    </SafeAreaView>
  );
}

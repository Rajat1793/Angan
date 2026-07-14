// OTP screen: verifies the 6-digit email code sent from the login screen.
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, useToast } from '@/components/ui';
import { verifyEmailOtp } from '@/lib/auth';
import { otpSchema, type OtpInput } from '@/lib/validation';

export default function Otp() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [loading, setLoading] = useState(false);
  const toast = useToast((s) => s.show);
  const { control, handleSubmit, formState } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  // Verify the code; success triggers the global auth listener to route.
  const onSubmit = async (values: OtpInput) => {
    setLoading(true);
    try {
      await verifyEmailOtp(String(email), values.code);
    } catch (e) {
      toast((e as Error).message ?? 'Invalid code', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-5 px-6">
        <Text className="text-2xl font-bold text-foreground">Enter code</Text>
        <Text className="text-sm text-foreground/60">
          We sent a 6-digit code to {email}.
        </Text>
        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Verification code"
              keyboardType="number-pad"
              maxLength={6}
              value={value}
              onChangeText={onChange}
              error={formState.errors.code?.message}
            />
          )}
        />
        <Button label="Verify" loading={loading} onPress={handleSubmit(onSubmit)} />
      </View>
    </SafeAreaView>
  );
}

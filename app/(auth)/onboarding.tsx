// Onboarding screen: new users set their name + flat to finish their profile.
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, useToast } from '@/components/ui';
import { completeOnboarding } from '@/lib/auth';
import { onboardingSchema, type OnboardingInput } from '@/lib/validation';
import { useAuthStore } from '@/store/auth.store';

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const toast = useToast((s) => s.show);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const { control, handleSubmit, formState } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { full_name: '', flat_id: '' },
  });

  // Persist name + flat, then optimistically update the local profile.
  const onSubmit = async (values: OnboardingInput) => {
    if (!profile) return;
    setLoading(true);
    try {
      await completeOnboarding(profile.id, values.full_name, values.flat_id);
      setProfile({ ...profile, full_name: values.full_name, flat_id: values.flat_id });
    } catch (e) {
      toast((e as Error).message ?? 'Could not save', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-5 px-6">
        <Text className="text-2xl font-bold text-foreground">Welcome</Text>
        <Text className="text-sm text-foreground/60">
          Tell us a little about you to finish setting up.
        </Text>
        <Controller
          control={control}
          name="full_name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Full name"
              value={value}
              onChangeText={onChange}
              error={formState.errors.full_name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="flat_id"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Flat"
              placeholder="e.g. A-101"
              value={value}
              onChangeText={onChange}
              error={formState.errors.flat_id?.message}
            />
          )}
        />
        <Button label="Continue" loading={loading} onPress={handleSubmit(onSubmit)} />
      </View>
    </SafeAreaView>
  );
}

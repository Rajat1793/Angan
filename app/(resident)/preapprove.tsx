// Resident pre-approval: create a guest pass, then show its QR + OTP.
import { useState } from 'react';
import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button, Input, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import type { Visitor } from '@/lib/database.types';
import { createPreApproval } from '@/lib/passes';
import { useAuthStore } from '@/store/auth.store';

export default function PreApprove() {
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast((s) => s.show);
  const [name, setName] = useState('');
  const [pass, setPass] = useState<Visitor | null>(null);
  const [saving, setSaving] = useState(false);

  // Create the pre-approved visitor row and surface the pass.
  const generate = async () => {
    if (!profile?.society_id) return;
    if (name.trim().length < 2) return toast('Enter guest name', 'info');
    setSaving(true);
    try {
      const created = await createPreApproval(
        name.trim(),
        profile.society_id,
        profile.flat_id,
        profile.id,
      );
      setPass(created);
      toast('Pass created', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Could not create pass', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold title="Pre-approve guest">
      <View className="gap-5 p-5">
        {!pass ? (
          <>
            <Input label="Guest name" value={name} onChangeText={setName} />
            <Button label="Generate pass" loading={saving} onPress={generate} />
          </>
        ) : (
          <View className="items-center gap-4">
            <Text className="text-lg font-semibold text-foreground">{pass.name}</Text>
            {/* QR encodes the opaque pass code the guard scans. */}
            <View className="rounded-2xl bg-white p-4">
              <QRCode value={pass.pass_code ?? ''} size={200} />
            </View>
            <Text className="text-sm text-foreground/60">
              Or share OTP: <Text className="font-bold text-primary">{pass.otp}</Text>
            </Text>
            <Button
              label="Create another"
              variant="outline"
              onPress={() => {
                setPass(null);
                setName('');
              }}
            />
          </View>
        )}
      </View>
    </ScreenScaffold>
  );
}

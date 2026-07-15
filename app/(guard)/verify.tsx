// Guard verify: scan a pass QR or type the OTP to admit a pre-approved guest.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Input, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { verifyPass } from '@/lib/passes';

export default function Verify() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast((s) => s.show);
  const queryClient = useQueryClient();

  // Shared redemption path for both scanned and typed codes.
  const redeem = async (value: string) => {
    setBusy(true);
    try {
      const v = await verifyPass(value);
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast(`${v.name} admitted`, 'success');
      setCode('');
    } catch (e) {
      toast((e as Error).message ?? 'Invalid pass', 'error');
    } finally {
      setBusy(false);
      setScanning(false);
    }
  };

  // Camera scanner overlay; fires once on a decoded QR.
  if (scanning) {
    return (
      <View className="flex-1 bg-black">
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => !busy && redeem(data)}
        />
        <View className="absolute inset-x-0 bottom-10 items-center">
          <Button label="Cancel" variant="outline" onPress={() => setScanning(false)} />
        </View>
      </View>
    );
  }

  return (
    <ScreenScaffold title="Verify pass">
      <View className="gap-5 p-5">
        <Button
          label="Scan QR"
          onPress={async () => {
            if (!permission?.granted) {
              const res = await requestPermission();
              if (!res.granted) return toast('Camera permission needed', 'info');
            }
            setScanning(true);
          }}
        />
        <Text className="text-center text-sm text-foreground/50">or</Text>
        <Input
          label="Enter OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />
        <Button label="Verify OTP" loading={busy} onPress={() => redeem(code)} />
      </View>
    </ScreenScaffold>
  );
}

// Guard visitor registration: RHF form, type picker, optional camera photo.
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Input, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { FlatPicker } from '@/components/visitor/FlatPicker';
import { uploadVisitorPhoto } from '@/lib/storage';
import { createVisitor } from '@/lib/visitors';
import { visitorSchema, type VisitorInput } from '@/lib/validation';
import { useAuthStore } from '@/store/auth.store';
import { useOfflineStore } from '@/store/offline.store';

const TYPES: VisitorInput['type'][] = ['delivery', 'cab', 'guest', 'service'];

export default function Register() {
  const profile = useAuthStore((s) => s.profile);
  const toast = useToast((s) => s.show);
  const queryClient = useQueryClient();
  const enqueue = useOfflineStore((s) => s.enqueue);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const { control, handleSubmit, watch, setValue, formState } = useForm<VisitorInput>({
    resolver: zodResolver(visitorSchema),
    defaultValues: { name: '', phone: '', flat_id: '', type: 'delivery', purpose: '', vehicle: '' },
  });
  const type = watch('type');

  // Capture a still from the camera and keep its local URI for upload.
  const capture = async () => {
    const shot = await cameraRef.current?.takePictureAsync({ quality: 0.5 });
    if (shot?.uri) setPhotoUri(shot.uri);
    setCameraOpen(false);
  };

  // Optionally upload the photo, then insert the pending visitor row.
  const onSubmit = async (values: VisitorInput) => {
    if (!profile?.society_id) return toast('No society on profile', 'error');
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (photoUri) photoUrl = await uploadVisitorPhoto(photoUri, profile.society_id);
      await createVisitor(
        { ...values, society_id: profile.society_id, photo_url: photoUrl },
        profile.id,
      );
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast('Visitor registered', 'success');
      router.back();
    } catch (e) {
      // On network failure, queue the registration to sync on reconnect.
      enqueue({
        localId: `${Date.now()}`,
        input: values,
        societyId: profile.society_id,
        flatId: values.flat_id,
        createdBy: profile.id,
        createdAt: Date.now(),
      });
      toast('Saved offline — will sync when online', 'info');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  // Full-screen camera overlay shown only while capturing.
  if (cameraOpen) {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View className="absolute inset-x-0 bottom-10 items-center">
          <Pressable
            onPress={capture}
            className="h-16 w-16 rounded-full border-4 border-white bg-white/30"
          />
        </View>
      </View>
    );
  }

  return (
    <ScreenScaffold title="Register visitor">
      <ScrollView contentContainerClassName="gap-4 p-5">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input label="Name" value={value} onChangeText={onChange} error={formState.errors.name?.message} />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Phone"
              keyboardType="phone-pad"
              maxLength={10}
              value={value}
              onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
              error={formState.errors.phone?.message}
            />
          )}
        />

        {/* Mandatory flat destination with searchable picker. */}
        <Controller
          control={control}
          name="flat_id"
          render={({ field: { onChange, value } }) => (
            <FlatPicker
              societyId={profile?.society_id}
              value={value}
              onChange={onChange}
              error={formState.errors.flat_id?.message}
            />
          )}
        />

        {/* Visitor type selector as a pill row. */}
        <View className="gap-1">
          <Text className="text-sm font-medium text-foreground">Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setValue('type', t)}
                className={`rounded-full px-4 py-2 ${type === t ? 'bg-primary' : 'bg-muted/10'}`}
              >
                <Text className={`text-sm capitalize ${type === t ? 'text-background' : 'text-foreground'}`}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Controller
          control={control}
          name="purpose"
          render={({ field: { onChange, value } }) => (
            <Input label="Purpose" value={value} onChangeText={onChange} error={formState.errors.purpose?.message} />
          )}
        />
        <Controller
          control={control}
          name="vehicle"
          render={({ field: { onChange, value } }) => (
            <Input label="Vehicle (optional)" value={value} onChangeText={onChange} />
          )}
        />

        <Button
          label={photoUri ? 'Retake photo' : 'Add photo'}
          variant="outline"
          onPress={async () => {
            if (!permission?.granted) {
              const res = await requestPermission();
              if (!res.granted) return toast('Camera permission needed', 'info');
            }
            setCameraOpen(true);
          }}
        />

        {/* Preview of the captured photo. */}
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            className="h-52 w-full rounded-2xl bg-muted/10"
            resizeMode="cover"
          />
        ) : null}

        <Button label="Register" loading={saving} onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </ScreenScaffold>
  );
}

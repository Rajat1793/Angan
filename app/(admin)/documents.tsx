// Admin documents: share society files (by URL) with residents.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { addDocument, listDocuments } from '@/lib/society';
import { useAuthStore } from '@/store/auth.store';

export default function AdminDocuments() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('general');
  const [saving, setSaving] = useState(false);

  const docs = useQuery({ queryKey: ['documents'], queryFn: listDocuments });

  const add = async () => {
    if (!profile?.society_id) return;
    if (title.trim().length < 2 || !url.trim().startsWith('http')) {
      return toast('Enter a title and a valid URL', 'info');
    }
    setSaving(true);
    try {
      await addDocument(profile.society_id, profile.id, title.trim(), url.trim(), category.trim() || 'general');
      setTitle('');
      setUrl('');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast('Document shared', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold title="Documents" showBack>
      <ScrollView contentContainerClassName="gap-3 p-5">
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="URL" placeholder="https://…" autoCapitalize="none" value={url} onChangeText={setUrl} />
        <Input label="Category" value={category} onChangeText={setCategory} />
        <Button label="Share document" loading={saving} onPress={add} />

        {docs.isLoading ? (
          <Loading />
        ) : (
          (docs.data ?? []).map((d) => (
            <Card key={d.id} className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{d.title}</Text>
                <Text className="text-xs text-foreground/40" numberOfLines={1}>
                  {d.url}
                </Text>
              </View>
              {d.category ? <Badge label={d.category} tone="neutral" /> : null}
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}

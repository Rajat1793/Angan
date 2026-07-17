// Admin notices tab: publish a notice (triggers push) and see the feed.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, Switch, Text, View } from 'react-native';

import { Badge, Button, Card, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { createNotice, listNotices } from '@/lib/community';
import { useAuthStore } from '@/store/auth.store';

export default function AdminNotices() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const notices = useQuery({ queryKey: ['notices'], queryFn: listNotices });

  // Publish a notice; a DB trigger fans out the push to residents.
  const publish = async () => {
    if (!profile?.society_id) return;
    if (title.trim().length < 2) return toast('Enter a title', 'info');
    setSaving(true);
    try {
      await createNotice(profile.society_id, profile.id, title.trim(), body.trim(), pinned);
      setTitle('');
      setBody('');
      setPinned(false);
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      toast('Notice published', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Could not publish', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold title="Notices">
      <View className="gap-3 p-5">
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Body" value={body} onChangeText={setBody} multiline />
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-foreground">Pin to top</Text>
          <Switch value={pinned} onValueChange={setPinned} />
        </View>
        <Button label="Publish" loading={saving} onPress={publish} />
      </View>
      {notices.isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={notices.data ?? []}
          keyExtractor={(n) => n.id}
          contentContainerClassName="gap-3 px-5 pb-8"
          renderItem={({ item }) => (
            <Card className="gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">{item.title}</Text>
                {item.pinned ? <Badge label="Pinned" tone="info" /> : null}
              </View>
              {item.body ? (
                <Text className="text-sm text-foreground/60">{item.body}</Text>
              ) : null}
            </Card>
          )}
        />
      )}
    </ScreenScaffold>
  );
}

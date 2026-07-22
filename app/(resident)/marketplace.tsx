// Resident marketplace: post and browse buy/sell/rent listings.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { createListing, listListings, markListingSold } from '@/lib/marketplace';
import { useAuthStore } from '@/store/auth.store';

const CATEGORIES = ['sell', 'rent', 'free', 'wanted'];

export default function Marketplace() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('sell');
  const [saving, setSaving] = useState(false);

  const listings = useQuery({ queryKey: ['listings'], queryFn: listListings });

  const post = async () => {
    if (!profile?.society_id) return;
    if (title.trim().length < 2) return toast('Enter a title', 'info');
    setSaving(true);
    try {
      const p = price.trim() ? Number(price.trim()) : null;
      await createListing(profile.society_id, profile.id, title.trim(), desc.trim(), Number.isNaN(p as number) ? null : p, category);
      setTitle('');
      setDesc('');
      setPrice('');
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast('Listed', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sold = async (id: string) => {
    try {
      await markListingSold(id);
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  return (
    <ScreenScaffold title="Marketplace" showBack>
      <ScrollView contentContainerClassName="gap-3 p-5">
        <Card className="gap-2">
          <Text className="text-base font-semibold text-foreground">Post a listing</Text>
          <Input label="Title" value={title} onChangeText={setTitle} />
          <Input label="Description" value={desc} onChangeText={setDesc} multiline />
          <Input label="Price (₹, optional)" keyboardType="number-pad" value={price} onChangeText={setPrice} />
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                className={`rounded-full px-4 py-2 ${category === c ? 'bg-primary' : 'bg-muted/10'}`}
              >
                <Text className={`text-sm capitalize ${category === c ? 'text-background' : 'text-foreground'}`}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <Button label="Post" loading={saving} onPress={post} />
        </Card>

        {listings.isLoading ? (
          <Loading />
        ) : (
          (listings.data ?? []).map((l) => (
            <Card key={l.id} className="gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-base font-semibold text-foreground">{l.title}</Text>
                <Badge label={l.category} tone="info" />
              </View>
              {l.description ? <Text className="text-sm text-foreground/70">{l.description}</Text> : null}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-primary">
                  {l.price != null ? `₹${l.price}` : '—'}
                </Text>
                <Text className="text-xs text-foreground/40">{l.author_name ?? 'Member'}</Text>
              </View>
              {l.author_id === profile?.id ? (
                <Button label="Mark sold" variant="outline" onPress={() => sold(l.id)} />
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}

// Storage helper: upload a visitor photo and return its public URL.
import { supabase } from './supabase';

const BUCKET = 'visitor-photos';

// Accepts a local file URI, uploads it, and returns the public URL.
export async function uploadVisitorPhoto(
  uri: string,
  societyId: string,
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.arrayBuffer();
  const path = `${societyId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

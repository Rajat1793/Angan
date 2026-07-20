// Community data: notices feed and polls with one-vote-per-resident logic.
import { supabase } from './supabase';
import type { Notice } from './database.types';

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}
export interface PollWithOptions {
  id: string;
  question: string;
  closes_at: string | null;
  options: PollOption[];
  myOptionId: string | null;
}

// Notices sorted with pinned first, then newest.
export async function listNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Notice[];
}

// A single notice for the detail view.
export async function getNotice(id: string): Promise<Notice | null> {
  const { data, error } = await supabase.from('notices').select('*').eq('id', id).single();
  if (error) throw error;
  return (data as Notice) ?? null;
}

// Admin publishes a notice (push fan-out happens via DB trigger).
export async function createNotice(
  societyId: string,
  authorId: string,
  title: string,
  body: string,
  pinned: boolean,
) {
  const { error } = await supabase.from('notices').insert({
    society_id: societyId,
    author_id: authorId,
    title,
    body,
    pinned,
  });
  if (error) throw error;
}

// Build polls with per-option vote counts and the caller's own vote.
export async function listPolls(userId: string): Promise<PollWithOptions[]> {
  const { data: polls, error } = await supabase
    .from('polls')
    .select('id, question, closes_at, poll_options(id, label)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const { data: votes } = await supabase
    .from('poll_votes')
    .select('poll_id, option_id, profile_id');

  return (polls ?? []).map((p: any) => {
    const pollVotes = (votes ?? []).filter((v) => v.poll_id === p.id);
    const mine = pollVotes.find((v) => v.profile_id === userId);
    return {
      id: p.id,
      question: p.question,
      closes_at: p.closes_at,
      myOptionId: mine?.option_id ?? null,
      options: (p.poll_options ?? []).map((o: any) => ({
        id: o.id,
        label: o.label,
        votes: pollVotes.filter((v) => v.option_id === o.id).length,
      })),
    };
  });
}

// Cast a single vote; the unique (poll_id, profile_id) constraint guards dupes.
export async function castVote(
  societyId: string,
  pollId: string,
  optionId: string,
  userId: string,
) {
  const { error } = await supabase.from('poll_votes').insert({
    society_id: societyId,
    poll_id: pollId,
    option_id: optionId,
    profile_id: userId,
  });
  if (error) throw error;
}

// ---- Community posts (resident social feed) ------------------------------

export interface Post {
  id: string;
  body: string;
  created_at: string;
  author_name: string | null;
  likes: number;
  liked_by_me: boolean;
  comments: number;
}

export interface PostComment {
  id: string;
  body: string;
  created_at: string;
  author_name: string | null;
}

// Newest-first feed annotated with like/comment counts and the caller's like.
export async function listPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, body, created_at, author:profiles(full_name), post_likes(profile_id), post_comments(id)',
    )
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    id: p.id,
    body: p.body,
    created_at: p.created_at,
    author_name: p.author?.full_name ?? null,
    likes: (p.post_likes ?? []).length,
    liked_by_me: (p.post_likes ?? []).some((l: any) => l.profile_id === userId),
    comments: (p.post_comments ?? []).length,
  }));
}

// A single post for the detail view.
export async function getPost(id: string, userId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, body, created_at, author:profiles(full_name), post_likes(profile_id), post_comments(id)',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  if (!data) return null;
  const p: any = data;
  return {
    id: p.id,
    body: p.body,
    created_at: p.created_at,
    author_name: p.author?.full_name ?? null,
    likes: (p.post_likes ?? []).length,
    liked_by_me: (p.post_likes ?? []).some((l: any) => l.profile_id === userId),
    comments: (p.post_comments ?? []).length,
  };
}

// Any member can publish a post to the society feed.
export async function createPost(societyId: string, authorId: string, body: string) {
  const { error } = await supabase
    .from('posts')
    .insert({ society_id: societyId, author_id: authorId, body });
  if (error) throw error;
}

// Toggle the caller's like on a post.
export async function togglePostLike(
  societyId: string,
  postId: string,
  userId: string,
  liked: boolean,
) {
  if (liked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('profile_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ society_id: societyId, post_id: postId, profile_id: userId });
    if (error) throw error;
  }
}

// Comments on a post, oldest first, with author names.
export async function listPostComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('id, body, created_at, author:profiles(full_name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author_name: c.author?.full_name ?? null,
  }));
}

export async function addPostComment(
  societyId: string,
  postId: string,
  authorId: string,
  body: string,
) {
  const { error } = await supabase
    .from('post_comments')
    .insert({ society_id: societyId, post_id: postId, author_id: authorId, body });
  if (error) throw error;
}

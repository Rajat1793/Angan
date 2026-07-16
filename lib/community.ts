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

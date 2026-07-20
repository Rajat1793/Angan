// Helpdesk data: resident tickets, admin assignment, and threaded comments.
import { supabase } from './supabase';
import type { Ticket, TicketStatus } from './database.types';

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name?: string | null;
}

// Tickets visible to the caller (RLS scopes to own tickets or admin's society).
export async function listTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('helpdesk_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ticket[];
}

// A single ticket for the detail view.
export async function getTicket(id: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('helpdesk_tickets')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return (data as Ticket) ?? null;
}

// Resident raises a ticket with an optional photo attachment.
export async function createTicket(
  societyId: string,
  raisedBy: string,
  title: string,
  description: string,
  photoUrl: string | null,
) {
  const { error } = await supabase.from('helpdesk_tickets').insert({
    society_id: societyId,
    raised_by: raisedBy,
    title,
    description,
    photo_url: photoUrl,
  });
  if (error) throw error;
}

// Admin moves a ticket along its status timeline.
export async function updateTicketStatus(id: string, status: TicketStatus) {
  const { error } = await supabase
    .from('helpdesk_tickets')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// Admin assigns a ticket to a staff/admin profile.
export async function assignTicket(id: string, assigneeId: string) {
  const { error } = await supabase
    .from('helpdesk_tickets')
    .update({ assigned_to: assigneeId })
    .eq('id', id);
  if (error) throw error;
}

// Threaded comments for a ticket, oldest first, with author names.
export async function listComments(ticketId: string): Promise<TicketComment[]> {
  const { data, error } = await supabase
    .from('ticket_comments')
    .select('id, ticket_id, author_id, body, created_at, author:profiles(full_name)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    id: c.id,
    ticket_id: c.ticket_id,
    author_id: c.author_id,
    body: c.body,
    created_at: c.created_at,
    author_name: c.author?.full_name ?? null,
  }));
}

export async function addComment(
  societyId: string,
  ticketId: string,
  authorId: string,
  body: string,
) {
  const { error } = await supabase.from('ticket_comments').insert({
    society_id: societyId,
    ticket_id: ticketId,
    author_id: authorId,
    body,
  });
  if (error) throw error;
}

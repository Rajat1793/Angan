// Minimal database types for the tables the client reads/writes.
export type Role = 'resident' | 'guard' | 'admin';
export type VisitorStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'inside'
  | 'exited';
export type VisitorType = 'delivery' | 'cab' | 'guest' | 'service';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type DueStatus = 'pending' | 'paid' | 'overdue';

export interface Profile {
  id: string;
  society_id: string | null;
  flat_id: string | null;
  role: Role;
  full_name: string | null;
  phone: string | null;
  expo_push_token: string | null;
  created_at: string;
}

export interface Visitor {
  id: string;
  society_id: string;
  flat_id: string | null;
  name: string;
  phone: string | null;
  type: VisitorType;
  purpose: string | null;
  vehicle: string | null;
  photo_url: string | null;
  status: VisitorStatus;
  otp: string | null;
  pass_code: string | null;
  entry_at: string | null;
  exit_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Notice {
  id: string;
  society_id: string;
  title: string;
  body: string | null;
  category: string | null;
  pinned: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  society_id: string;
  raised_by: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  photo_url: string | null;
  status: TicketStatus;
  created_at: string;
}

// Daily-help attendance data: list society staff with today's status + marking.
import { supabase } from './supabase';

export interface StaffAttendance {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  status: 'present' | 'absent' | null;
  attendance_id: string | null;
}

// Society staff joined with today's attendance row (if any).
export async function listStaffAttendance(day: string): Promise<StaffAttendance[]> {
  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, name, role, phone')
    .order('name');
  if (error) throw error;

  const { data: rows } = await supabase
    .from('staff_attendance')
    .select('id, staff_id, status')
    .eq('day', day);

  return (staff ?? []).map((s: any) => {
    const a = (rows ?? []).find((r: any) => r.staff_id === s.id);
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      phone: s.phone,
      status: (a?.status as 'present' | 'absent') ?? null,
      attendance_id: a?.id ?? null,
    };
  });
}

// Upsert today's attendance for a staff member.
export async function markAttendance(
  societyId: string,
  staffId: string,
  day: string,
  status: 'present' | 'absent',
  markedBy: string,
) {
  const { error } = await supabase.from('staff_attendance').upsert(
    {
      society_id: societyId,
      staff_id: staffId,
      day,
      status,
      check_in: status === 'present' ? new Date().toISOString() : null,
      marked_by: markedBy,
    },
    { onConflict: 'staff_id,day' },
  );
  if (error) throw error;
}

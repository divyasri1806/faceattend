import { supabase } from './supabase';
import type { AttendanceLog, Person } from '../types';

export async function fetchPersons(): Promise<Person[]> {
  const { data, error } = await supabase.from('persons').select('*').order('name');
  if (error) throw error;
  return data as Person[];
}

export async function registerPerson(person: Omit<Person, 'id' | 'created_at'>): Promise<Person> {
  const { data, error } = await supabase.from('persons').insert(person).select().single();
  if (error) throw error;
  return data as Person;
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from('persons').delete().eq('id', id);
  if (error) throw error;
}

export async function markAttendance(
  personId: string,
  confidence: number,
  status: 'present' | 'late' = 'present'
): Promise<AttendanceLog | null> {
  const today = new Date().toISOString().split('T')[0];

  // Check if already marked today
  const { data: existing } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('person_id', personId)
    .eq('session_date', today)
    .maybeSingle();

  if (existing) return null;

  const { data, error } = await supabase
    .from('attendance_logs')
    .insert({ person_id: personId, confidence, status, session_date: today })
    .select('*, persons(*)')
    .single();

  if (error) throw error;
  return data as AttendanceLog;
}

export async function fetchTodayAttendance(): Promise<AttendanceLog[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*, persons(*)')
    .eq('session_date', today)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return data as AttendanceLog[];
}

export async function fetchAttendanceByDate(date: string): Promise<AttendanceLog[]> {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*, persons(*)')
    .eq('session_date', date)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return data as AttendanceLog[];
}

export async function fetchRecentAttendance(limit = 50): Promise<AttendanceLog[]> {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*, persons(*)')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as AttendanceLog[];
}

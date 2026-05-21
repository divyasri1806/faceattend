export interface Person {
  id: string;
  name: string;
  role: 'student' | 'employee';
  department: string;
  face_descriptor: number[];
  image_url: string;
  created_at: string;
}

export interface AttendanceLog {
  id: string;
  person_id: string;
  timestamp: string;
  confidence: number;
  status: 'present' | 'late' | 'absent';
  session_date: string;
  persons?: Person;
}

export interface AttendanceWithPerson extends AttendanceLog {
  persons: Person;
}

export type Page = 'dashboard' | 'monitor' | 'register' | 'records';

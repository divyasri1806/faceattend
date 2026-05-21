interface AttendanceBadgeProps {
  status: 'present' | 'late' | 'absent';
}

export default function AttendanceBadge({ status }: AttendanceBadgeProps) {
  const styles = {
    present: 'bg-emerald-100 text-emerald-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

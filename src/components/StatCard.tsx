import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'sky' | 'emerald' | 'amber' | 'rose';
}

const colorMap = {
  sky: { bg: 'bg-sky-50', icon: 'bg-sky-100 text-sky-600', value: 'text-sky-700' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', value: 'text-amber-700' },
  rose: { bg: 'bg-rose-50', icon: 'bg-rose-100 text-rose-600', value: 'text-rose-700' },
};

export default function StatCard({ label, value, icon: Icon, trend, color = 'sky' }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <div className={`${colors.bg} rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`${colors.icon} p-3 rounded-xl`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <p className={`${colors.value} text-2xl font-bold mt-0.5`}>{value}</p>
        {trend && <p className="text-gray-400 text-xs mt-1">{trend}</p>}
      </div>
    </div>
  );
}

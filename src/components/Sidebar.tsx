import { Camera, LayoutDashboard, UserPlus, ClipboardList, Scan } from 'lucide-react';
import type { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'monitor', label: 'Live Monitor', icon: Scan },
  { id: 'register', label: 'Register Person', icon: UserPlus },
  { id: 'records', label: 'Records', icon: ClipboardList },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex flex-col z-10">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="bg-sky-500 p-2 rounded-lg">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">FaceAttend</h1>
          <p className="text-gray-400 text-xs">Smart Attendance System</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentPage === id
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg px-4 py-3">
          <p className="text-gray-400 text-xs">Today</p>
          <p className="text-white text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </aside>
  );
}

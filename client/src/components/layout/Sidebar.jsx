import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Laptop,
  PlusCircle,
  QrCode,
  Wrench,
  Boxes,
  History,
  FileBarChart,
  Building2,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function Sidebar() {
  const { user } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Asset Inventory', to: '/assets', icon: Laptop },
    { name: 'Custody & Handovers', to: '/assignments', icon: Users },
    { name: 'Register Asset', to: '/assets/new', icon: PlusCircle, roles: ['Admin', 'Asset Manager'] },
    { name: 'QR Camera Scanner', to: '/scanner', icon: QrCode },
    { name: 'Maintenance Center', to: '/maintenance', icon: Wrench },
    { name: 'Spare Parts Stock', to: '/inventory', icon: Boxes },
    { name: 'Stock Movements', to: '/inventory/movements', icon: History },
    { name: 'Audit & Reports', to: '/reports', icon: FileBarChart },
    { name: 'Organization & Depts', to: '/organization', icon: Building2, roles: ['Admin'] },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-4 hidden md:flex shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          ITAM Management
        </div>
        {navigation.map((item) => {
          if (item.roles && user && !item.roles.includes(user.role)) return null;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Gateway Connected</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400 font-mono">v1.0.0 (Node 24 LTS)</div>
      </div>
    </aside>
  );
}

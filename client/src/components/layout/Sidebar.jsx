import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

export function Sidebar() {
  const { user, setUser } = useAuthStore();
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const navigate = useNavigate();

  const handleQuickAdminLogin = async () => {
    setQuickLoginLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: 'admin@testitcorp.com',
        password: 'AdminPassword123!',
      });
      const { user: loggedInUser, token, organization } = res.data.data;
      setUser(loggedInUser, token, organization);
      window.location.reload(); // Refresh to ensure all queries reload with new token
    } catch (err) {
      console.error('Quick login failed:', err);
      navigate('/login');
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
    { name: 'Asset Inventory', to: '/assets', icon: Laptop, end: true },
    { name: 'Custody & Handovers', to: '/assignments', icon: Users, end: true },
    { name: 'Register Asset', to: '/assets/new', icon: PlusCircle, roles: ['Admin', 'Asset Manager'], end: true },
    { name: 'QR Camera Scanner', to: '/scanner', icon: QrCode, end: true },
    { name: 'Maintenance Center', to: '/maintenance', icon: Wrench, end: true },
    { name: 'Spare Parts Stock', to: '/inventory', icon: Boxes, end: true },
    { name: 'Stock Movements', to: '/inventory/movements', icon: History, end: true },
    { name: 'Audit & Reports', to: '/reports', icon: FileBarChart, end: true },
    { name: 'Organization & Depts', to: '/organization', icon: Building2, roles: ['Admin'], end: true },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-4 hidden md:flex shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          ITAM Management
        </div>
        {navigation.map((item) => {
          // If user is logged in, filter by role
          if (item.roles && user && !item.roles.includes(user.role)) return null;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={true}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Guest 1-Click Login Prompt */}
        {!user && (
          <div className="mt-4 p-3 bg-sky-50/80 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-900 dark:text-sky-300">
              <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Guest Session</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Sign in to unlock asset registration, spare parts, and full taxonomy options.
            </p>
            <button
              onClick={handleQuickAdminLogin}
              disabled={quickLoginLoading}
              className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{quickLoginLoading ? 'Signing in...' : '1-Click Admin Login'}</span>
            </button>
          </div>
        )}
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

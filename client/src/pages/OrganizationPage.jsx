import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  Tag,
  PlusCircle,
  Shield,
  Layers,
  X,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function OrganizationPage() {
  const queryClient = useQueryClient();
  const { user, setUser, organization } = useAuthStore();
  const [activeTab, setActiveTab] = useState('departments');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  const handleQuickAdminLogin = async () => {
    setQuickLoginLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: 'admin@testitcorp.com',
        password: 'AdminPassword123!',
      });
      const { user: loggedInUser, token, organization: org } = res.data.data;
      setUser(loggedInUser, token, org);
      window.location.reload();
    } catch (err) {
      console.error('Quick login failed:', err);
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [locForm, setLocForm] = useState({ building: '', floor: '', room: '' });

  // Queries
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data.data;
    },
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await api.get('/locations');
      return res.data.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  // Mutations
  const addDeptMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/departments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', code: '' });
    },
  });

  const addLocMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/locations', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsLocModalOpen(false);
      setLocForm({ building: '', floor: '', room: '' });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-500" />
            {organization?.name || 'Organization Workspace'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tenant Code: <span className="font-mono font-bold text-sky-600">{organization?.code}</span> • Tag Prefix:{' '}
            <span className="font-mono font-bold text-sky-600">{organization?.assetTagPrefix}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'departments' ? (
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Add Department
            </button>
          ) : activeTab === 'locations' ? (
            <button
              onClick={() => setIsLocModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Add Location
            </button>
          ) : null}
        </div>
      </div>

      {/* Guest Mode Warning Banner */}
      {!user && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Active Session Required</p>
              <p className="text-slate-600 dark:text-slate-400">
                You are currently in guest mode. Sign in to view and manage organization departments, locations, and asset categories.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            disabled={quickLoginLoading}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm whitespace-nowrap transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{quickLoginLoading ? 'Signing In...' : '1-Click Admin Login'}</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('departments')}
          className={`py-3 px-4 border-b-2 transition ${
            activeTab === 'departments'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Departments ({departments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`py-3 px-4 border-b-2 transition ${
            activeTab === 'locations'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Locations & Rooms ({locations?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-4 border-b-2 transition ${
            activeTab === 'categories'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Asset Categories ({categories?.length || 0})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {departments?.map((dept) => (
            <div
              key={dept._id}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{dept.name}</h4>
                <span className="font-mono text-xs text-sky-600 dark:text-sky-400 font-semibold">{dept.code}</span>
              </div>
              <Building2 className="w-6 h-6 text-slate-300 dark:text-slate-700" />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {locations?.map((loc) => (
            <div
              key={loc._id}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{loc.building}</h4>
                <div className="text-xs text-slate-500">{loc.floor ? `${loc.floor} • ` : ''}{loc.room}</div>
              </div>
              <MapPin className="w-6 h-6 text-slate-300 dark:text-slate-700" />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {categories?.map((cat) => (
            <div
              key={cat._id}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-600">{cat.code}</span>
                <Tag className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</h4>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal (Rendered via Portal to cover the full viewport and Navbar) */}
      {isDeptModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Department</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addDeptMutation.mutate(deptForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="Security Operations"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  placeholder="SECOPS"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDeptMutation.isPending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Location Modal (Rendered via Portal to cover the full viewport and Navbar) */}
      {isLocModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Location</h3>
              <button onClick={() => setIsLocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addLocMutation.mutate(locForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Building *
                </label>
                <input
                  type="text"
                  required
                  value={locForm.building}
                  onChange={(e) => setLocForm({ ...locForm, building: e.target.value })}
                  placeholder="Tower A"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={locForm.floor}
                    onChange={(e) => setLocForm({ ...locForm, floor: e.target.value })}
                    placeholder="Floor 4"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Lab *
                  </label>
                  <input
                    type="text"
                    required
                    value={locForm.room}
                    onChange={(e) => setLocForm({ ...locForm, room: e.target.value })}
                    placeholder="Server Room 402"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLocMutation.isPending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

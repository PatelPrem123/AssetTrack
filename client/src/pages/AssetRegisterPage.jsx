import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Laptop,
  Cpu,
  Layers,
  HardDrive,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function AssetRegisterPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  const handleQuickAdminLogin = async () => {
    setQuickLoginLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: 'admin@testitcorp.com',
        password: 'AdminPassword123!',
      });
      const { user: loggedInUser, token, organization } = res.data.data;
      setUser(loggedInUser, token, organization);
      window.location.reload();
    } catch (err) {
      setError('Quick login failed: ' + err.message);
    } finally {
      setQuickLoginLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    departmentId: '',
    locationId: '',
    purchaseCostInr: '65000',
    warrantyExpiry: '2027-12-31',
    // Specifications
    cpu: {
      manufacturer: 'Intel',
      model: 'Core i7-13700',
      cores: 16,
      threads: 24,
      baseClockGhz: 2.1,
      boostClockGhz: 5.2,
    },
    ramModules: [
      { slot: 1, capacityGb: 16, speedMts: 5200, make: 'Crucial' },
    ],
    storageDrives: [
      { capacityGb: 1000, driveType: 'NVMe SSD', manufacturer: 'Samsung', serialNumber: 'S677NF0W123' },
    ],
    networking: {
      macAddress: '00:1A:2B:3C:4D:5E',
      ipAddress: '192.168.1.105',
    },
  });

  const { data: categories, isLoading: isLoadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  const { data: departments, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data.data;
    },
  });

  const { data: locations, isLoading: isLoadingLocs } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await api.get('/locations');
      return res.data.data;
    },
  });

  // Client-side defaults in case data is loading or network is offline
  const fallbackCategories = [
    { _id: 'cat-lap', name: 'Laptops', code: 'LAP' },
    { _id: 'cat-dsk', name: 'Desktop Computers', code: 'DSK' },
    { _id: 'cat-wrk', name: 'Workstations', code: 'WRK' },
    { _id: 'cat-mon', name: 'Monitors', code: 'MON' },
    { _id: 'cat-net', name: 'Network Switches & Routers', code: 'NET' },
    { _id: 'cat-str', name: 'Storage Devices', code: 'STR' },
  ];

  const fallbackDepartments = [
    { _id: 'dept-it', name: 'IT & Infrastructure', code: 'IT' },
    { _id: 'dept-eng', name: 'Engineering & Development', code: 'ENG' },
    { _id: 'dept-prod', name: 'Product & Design', code: 'PROD' },
    { _id: 'dept-ops', name: 'Operations & Facilities', code: 'OPS' },
    { _id: 'dept-hr', name: 'Human Resources', code: 'HR' },
  ];

  const fallbackLocations = [
    { _id: 'loc-srv', building: 'HQ Main', room: 'Server Room 101' },
    { _id: 'loc-bay', building: 'HQ Main', room: 'IT Diagnostics Bay' },
    { _id: 'loc-eng', building: 'Tech Hub', room: 'Engineering Floor 402' },
    { _id: 'loc-rem', building: 'Remote Depot', room: 'Dispatched to Employee' },
  ];

  const activeCategories = (categories && categories.length > 0) ? categories : fallbackCategories;
  const activeDepartments = (departments && departments.length > 0) ? departments : fallbackDepartments;
  const activeLocations = (locations && locations.length > 0) ? locations : fallbackLocations;

  // Automatically select the first option when data loads
  useEffect(() => {
    if (activeCategories.length && !formData.categoryId) {
      const firstId = activeCategories[0]._id || activeCategories[0].id;
      setFormData((prev) => ({ ...prev, categoryId: firstId }));
    }
    if (activeDepartments.length && !formData.departmentId) {
      const firstId = activeDepartments[0]._id || activeDepartments[0].id;
      setFormData((prev) => ({ ...prev, departmentId: firstId }));
    }
    if (activeLocations.length && !formData.locationId) {
      const firstId = activeLocations[0]._id || activeLocations[0].id;
      setFormData((prev) => ({ ...prev, locationId: firstId }));
    }
  }, [activeCategories, activeDepartments, activeLocations, formData.categoryId, formData.departmentId, formData.locationId]);

  const registerMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/assets', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSuccess(`Asset ${data.data.assetTag} registered successfully!`);
      setTimeout(() => navigate('/assets'), 1200);
    },
    onError: (err) => {
      setError(err.message || 'Failed to register asset');
    },
  });

  const handleAddRam = () => {
    setFormData((prev) => ({
      ...prev,
      ramModules: [
        ...prev.ramModules,
        { slot: prev.ramModules.length + 1, capacityGb: 16, speedMts: 5200, make: 'Crucial' },
      ],
    }));
  };

  const handleRemoveRam = (index) => {
    setFormData((prev) => ({
      ...prev,
      ramModules: prev.ramModules.filter((_, i) => i !== index),
    }));
  };

  const handleAddStorage = () => {
    setFormData((prev) => ({
      ...prev,
      storageDrives: [
        ...prev.storageDrives,
        { capacityGb: 512, driveType: 'SATA SSD', manufacturer: 'Crucial', serialNumber: `SN-${Date.now()}` },
      ],
    }));
  };

  const handleRemoveStorage = (index) => {
    setFormData((prev) => ({
      ...prev,
      storageDrives: prev.storageDrives.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const totalRam = formData.ramModules.reduce((sum, m) => sum + Number(m.capacityGb || 0), 0);
    const purchaseCostMinor = Math.round(parseFloat(formData.purchaseCostInr || '0') * 100);

    const payload = {
      name: formData.name,
      categoryId: formData.categoryId || (activeCategories[0]?._id || activeCategories[0]?.id),
      manufacturer: formData.manufacturer,
      model: formData.model,
      serialNumber: formData.serialNumber,
      departmentId: formData.departmentId || (activeDepartments[0]?._id || activeDepartments[0]?.id),
      locationId: formData.locationId || (activeLocations[0]?._id || activeLocations[0]?.id),
      purchaseCostMinor,
      warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry) : undefined,
      specifications: {
        cpu: formData.cpu,
        ram: {
          totalCapacityGb: totalRam,
          modules: formData.ramModules,
        },
        storage: formData.storageDrives,
        networking: formData.networking,
      },
    };

    registerMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/assets')}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Hardware Asset Registration
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Auto-generates unique sequential asset tags and opaque QR tokens (DEC-002, DEC-004)
            </p>
          </div>
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
                You are currently in guest mode. Sign in to populate taxonomy categories, departments, and register hardware assets.
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

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Identity */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Laptop className="w-4 h-4 text-sky-500" />
            General Asset Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asset Display Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dell Precision 5820 Workstation"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hardware Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              >
                {activeCategories.map((cat) => {
                  const catId = cat._id || cat.id;
                  return (
                    <option key={catId} value={catId}>
                      {cat.name} ({cat.code})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                required
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Dell / Apple / Lenovo"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model Number / Name *
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Precision 5820"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Serial Number (Chassis) *
              </label>
              <input
                type="text"
                required
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="SN-DL-88776655"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              >
                {activeDepartments.map((dept) => {
                  const deptId = dept._id || dept.id;
                  return (
                    <option key={deptId} value={deptId}>
                      {dept.name} ({dept.code})
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Base Location *
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              >
                {activeLocations.map((loc) => {
                  const locId = loc._id || loc.id;
                  return (
                    <option key={locId} value={locId}>
                      {loc.building || 'HQ'} - {loc.room || 'Main Room'}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Cost (INR)
              </label>
              <input
                type="number"
                value={formData.purchaseCostInr}
                onChange={(e) => setFormData({ ...formData, purchaseCostInr: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Warranty Expiry Date
              </label>
              <input
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Deep Hardware Architecture */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            Structured Hardware Architecture (DEC-002)
          </h2>

          {/* CPU Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                CPU Make
              </label>
              <input
                type="text"
                value={formData.cpu.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, cpu: { ...formData.cpu, manufacturer: e.target.value } })
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                CPU Model
              </label>
              <input
                type="text"
                value={formData.cpu.model}
                onChange={(e) =>
                  setFormData({ ...formData, cpu: { ...formData.cpu, model: e.target.value } })
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Cores / Threads
              </label>
              <input
                type="number"
                value={formData.cpu.cores}
                onChange={(e) =>
                  setFormData({ ...formData, cpu: { ...formData.cpu, cores: Number(e.target.value) } })
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Boost Clock (GHz)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.cpu.boostClockGhz}
                onChange={(e) =>
                  setFormData({ ...formData, cpu: { ...formData.cpu, boostClockGhz: Number(e.target.value) } })
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* RAM Modules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                RAM Memory Modules
              </span>
              <button
                type="button"
                onClick={handleAddRam}
                className="text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> Add Slot
              </button>
            </div>
            <div className="space-y-2">
              {formData.ramModules.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-xs font-mono font-bold text-slate-400 w-12">Slot {idx + 1}</span>
                  <input
                    type="number"
                    value={m.capacityGb}
                    placeholder="16"
                    onChange={(e) => {
                      const updated = [...formData.ramModules];
                      updated[idx].capacityGb = Number(e.target.value);
                      setFormData({ ...formData, ramModules: updated });
                    }}
                    className="w-20 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500">GB</span>
                  <input
                    type="number"
                    value={m.speedMts}
                    placeholder="5200"
                    onChange={(e) => {
                      const updated = [...formData.ramModules];
                      updated[idx].speedMts = Number(e.target.value);
                      setFormData({ ...formData, ramModules: updated });
                    }}
                    className="w-24 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500">MT/s</span>
                  <input
                    type="text"
                    value={m.make}
                    placeholder="Make / Brand"
                    onChange={(e) => {
                      const updated = [...formData.ramModules];
                      updated[idx].make = e.target.value;
                      setFormData({ ...formData, ramModules: updated });
                    }}
                    className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  {formData.ramModules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRam(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Storage Drives */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                Storage Drives
              </span>
              <button
                type="button"
                onClick={handleAddStorage}
                className="text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3 h-3" /> Add Drive
              </button>
            </div>
            <div className="space-y-2">
              {formData.storageDrives.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-xs font-mono font-bold text-slate-400 w-14">Drive {idx + 1}</span>
                  <input
                    type="number"
                    value={d.capacityGb}
                    placeholder="1000"
                    onChange={(e) => {
                      const updated = [...formData.storageDrives];
                      updated[idx].capacityGb = Number(e.target.value);
                      setFormData({ ...formData, storageDrives: updated });
                    }}
                    className="w-24 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500">GB</span>
                  <select
                    value={d.driveType}
                    onChange={(e) => {
                      const updated = [...formData.storageDrives];
                      updated[idx].driveType = e.target.value;
                      setFormData({ ...formData, storageDrives: updated });
                    }}
                    className="w-32 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="NVMe SSD">NVMe SSD</option>
                    <option value="SATA SSD">SATA SSD</option>
                    <option value="HDD 7200RPM">HDD 7200RPM</option>
                  </select>
                  <input
                    type="text"
                    value={d.serialNumber}
                    placeholder="Drive Serial"
                    onChange={(e) => {
                      const updated = [...formData.storageDrives];
                      updated[idx].serialNumber = e.target.value;
                      setFormData({ ...formData, storageDrives: updated });
                    }}
                    className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                  {formData.storageDrives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStorage(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/assets')}
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {registerMutation.isPending ? 'Persisting Hardware...' : 'Register Hardware Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}

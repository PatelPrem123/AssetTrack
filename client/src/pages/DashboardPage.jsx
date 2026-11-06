import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Laptop,
  CheckCircle2,
  Users,
  Wrench,
  AlertTriangle,
  FileSpreadsheet,
  QrCode,
  PlusCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { QRScannerModal } from '../features/qr/QRScannerModal';

const CATEGORY_COLORS = ['#0284c7', '#0d9488', '#e11d48', '#8b5cf6', '#d97706', '#64748b', '#059669'];
const STATUS_COLORS = {
  Available: '#10b981',
  Assigned: '#0284c7',
  'Under Repair': '#f59e0b',
  Retired: '#64748b',
  Disposed: '#ef4444',
  Purchased: '#8b5cf6',
};

const STATUS_BADGE_CLASSES = {
  Available: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Assigned: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'Under Repair': 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Retired: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  Disposed: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  Purchased: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800',
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data.data;
    },
  });

  const { data: catData } = useQuery({
    queryKey: ['reports', 'categories'],
    queryFn: async () => {
      const res = await api.get('/reports/categories');
      return res.data.data;
    },
  });

  const { data: statusData } = useQuery({
    queryKey: ['reports', 'status'],
    queryFn: async () => {
      const res = await api.get('/reports/status');
      return res.data.data;
    },
  });

  const { data: warrantyData } = useQuery({
    queryKey: ['reports', 'warranty', 90],
    queryFn: async () => {
      const res = await api.get('/reports/warranty?days=90');
      return res.data.data;
    },
  });

  const handleDownloadExcel = () => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/reports/export.xlsx`;
    // Trigger download via anchor
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `AssetTrack-Enterprise-Inventory-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
      });
  };

  const formatCurrency = (minorAmount) => {
    if (!minorAmount) return '₹0';
    return `₹${(minorAmount / 100).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Enterprise ITAM Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time custody tracking, hardware ledger, and predictive warranty monitoring
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <QrCode className="w-4 h-4 text-sky-500" />
            Scan QR
          </button>

          {['Admin', 'Asset Manager'].includes(user?.role) && (
            <Link
              to="/assets/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Register Asset
            </Link>
          )}

          {['Admin', 'Asset Manager', 'Auditor'].includes(user?.role) && (
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Assets */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Assets</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isSummaryLoading ? '...' : summaryData?.totalAssets || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Valued at {formatCurrency(summaryData?.totalAcquisitionValueMinor)}
            </div>
          </div>
        </div>

        {/* Available Devices */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {isSummaryLoading ? '...' : summaryData?.availableAssets || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Ready for deployment</div>
          </div>
        </div>

        {/* Assigned Devices */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Custody</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {isSummaryLoading ? '...' : summaryData?.assignedAssets || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Active employee handovers</div>
          </div>
        </div>

        {/* Under Repair */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Maintenance</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {isSummaryLoading ? '...' : summaryData?.underRepairAssets || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {summaryData?.openMaintenanceTickets || 0} active tickets
            </div>
          </div>
        </div>

        {/* Low Stock Breaches */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Low Stock Parts</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {isSummaryLoading ? '...' : summaryData?.lowStockItems || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Breached reorder level</div>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Category Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Asset composition by hardware taxonomy</p>
            </div>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>

          <div className="h-64">
            {catData && catData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catData}
                    dataKey="count"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {catData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No asset inventory registered yet
              </div>
            )}
          </div>
        </div>

        {/* Lifecycle Status Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Lifecycle Statuses</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Controlled state pipeline (DEC-002)</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="h-64">
            {statusData && statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={STATUS_COLORS[entry.status] || '#0284c7'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No status data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 90-Day Warranty Expiration Horizon */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Upcoming Warranty Horizon (Next 90 Days)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Proactive maintenance window for renewal and SLA governance
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
            {warrantyData?.length || 0} Assets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Asset Tag</th>
                <th className="px-6 py-3">Device Name & Model</th>
                <th className="px-6 py-3">Serial Number</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {warrantyData && warrantyData.length > 0 ? (
                warrantyData.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-3.5 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {asset.assetTag}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">
                      {asset.name}
                      <span className="text-[11px] text-slate-400 block">{asset.model}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {asset.serialNumber}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                      {asset.categoryId?.name || 'Hardware'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border shrink-0 ${
                          STATUS_BADGE_CLASSES[asset.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-amber-600 dark:text-amber-400">
                      {asset.warrantyExpiry
                        ? new Date(asset.warrantyExpiry).toISOString().split('T')[0]
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    No hardware warranties expiring in the next 90 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
}

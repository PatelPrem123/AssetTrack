import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Laptop,
  Search,
  Filter,
  PlusCircle,
  QrCode,
  Printer,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  Wrench,
  UserCheck,
  ChevronLeft,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { AssetDetailModal } from '../features/assets/AssetDetailModal';
import { PrintLabelModal } from '../features/qr/PrintLabelModal';
import { QRScannerModal } from '../features/qr/QRScannerModal';

const STATUS_BADGES = {
  Available: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  Assigned: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'Under Repair': 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Retired: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700',
  Disposed: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  Purchased: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800',
};

export function AssetsPage() {
  const { user, setUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
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

  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [labelAsset, setLabelAsset] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  const { data: assetData, isLoading } = useQuery({
    queryKey: ['assets', { search, selectedCategory, selectedStatus, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await api.get(`/assets?${params.toString()}`);
      return res.data;
    },
  });

  const assets = assetData?.data || [];
  const pagination = assetData?.pagination || { total: 0, pages: 1 };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Enterprise Hardware Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Structured specs, lifecycle status transitions, and dynamic QR labels
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <QrCode className="w-4 h-4 text-sky-500" />
            Scanner
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
                You are currently in guest mode. Sign in to view and search the enterprise hardware asset registry.
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

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by asset tag, serial number, model, or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Asset Tag</th>
                <th className="px-6 py-3.5">Hardware Item & Specs</th>
                <th className="px-6 py-3.5">Serial Number</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Custody / Location</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    Loading inventory records...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    {!user
                      ? 'Please sign in with an Administrator, Manager, or Auditor account to view hardware assets.'
                      : 'No matching assets found in this workspace.'}
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{asset.assetTag}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{asset.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {asset.manufacturer} {asset.model}
                        {asset.specifications?.cpu?.model && ` • ${asset.specifications.cpu.model}`}
                        {asset.specifications?.ram?.totalCapacityGb && ` • ${asset.specifications.ram.totalCapacityGb}GB`}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                      {asset.serialNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {asset.categoryId?.name || 'Hardware'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          STATUS_BADGES[asset.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {asset.assignedTo ? (
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>
                            {asset.assignedTo.name || `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">
                          {asset.locationId?.room || 'Warehouse Room 1'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAssetId(asset._id)}
                          title="Inspect Hardware Specs"
                          className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setLabelAsset(asset)}
                          title="Print Asset Label"
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AssetDetailModal
        isOpen={!!selectedAssetId}
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
      />

      <PrintLabelModal
        isOpen={!!labelAsset}
        asset={labelAsset}
        onClose={() => setLabelAsset(null)}
      />

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectAsset={(profile) => setSelectedAssetId(profile._id)}
      />
    </div>
  );
}

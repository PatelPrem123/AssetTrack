import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  UploadCloud,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  X,
  FileCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function ReportsPage() {
  const { user } = useAuthStore();
  const [warrantyDays, setWarrantyDays] = useState(90);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  // Queries
  const { data: warrantyAssets, isLoading: isWarrantyLoading } = useQuery({
    queryKey: ['reports', 'warranty', warrantyDays],
    queryFn: async () => {
      const res = await api.get(`/reports/warranty?days=${warrantyDays}`);
      return res.data.data;
    },
  });

  // Mutations
  const importMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/reports/import', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setImportStatus({
        success: true,
        message: `Successfully ingested ${data.data.createdCount} hardware assets into the tenant inventory.`,
      });
      setCsvContent('');
    },
    onError: (err) => {
      setImportStatus({
        success: false,
        message: err.message || 'Failed to import CSV dataset',
      });
    },
  });

  const handleDownloadExcel = () => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/reports/export.xlsx`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `AssetTrack-Enterprise-Inventory-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
      });
  };

  const handleSampleCsv = () => {
    const sample = `Asset Name,Manufacturer,Model,Serial Number,Category Code,Department Code,Room
Dell Latitude 5540,Dell,Latitude 5540,DL5540-001,LAP,IT,Lab 201
HP EliteDesk 800 G9,HP,EliteDesk 800 G9,HP800-002,DSK,ENG,Dev Room A
Lenovo ThinkStation P3,Lenovo,ThinkStation P3,LN-P3-003,WRK,FIN,Finance 104
Cisco Catalyst 2960,Cisco,WS-C2960-24TT,CS-2960-004,SWT,IT,Server Room`;
    setCsvContent(sample);
  };

  const handleCsvSubmit = (e) => {
    e.preventDefault();
    if (!csvContent.trim()) return;
    importMutation.mutate({ csvData: csvContent });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Audit, Analytics & Enterprise Exports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Streaming multi-sheet Excel reports and formula-sanitized bulk CSV ingestion (DEC-011)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {['Admin', 'Asset Manager'].includes(user?.role) && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              <UploadCloud className="w-4 h-4 text-sky-500" />
              Bulk CSV Ingestion
            </button>
          )}

          {['Admin', 'Asset Manager', 'Auditor'].includes(user?.role) && (
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Full Excel Workbook (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Excel Master Ledger
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-tab workbook containing Executive Summary, Complete Hardware Architecture, Active Custody Chains, and Spare Parts Stock.
          </p>
          <button
            onClick={handleDownloadExcel}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1"
          >
            Stream ExcelJS workbook <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Bulk CSV Importer
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fast batch onboarding with automatic tag generation, sequential index safety, and formula macro injection defense.
          </p>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 pt-1"
          >
            Launch CSV Pipeline <FileCheck className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Warranty Horizon Watchlist
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Track assets due for warranty expiration within 30, 60, or 90 days. Backed by automated background audit schedulers.
          </p>
          <div className="flex gap-1.5 pt-1">
            {[30, 60, 90, 180].map((days) => (
              <button
                key={days}
                onClick={() => setWarrantyDays(days)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  warrantyDays === days
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Warranty Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Warranty Expirations (Horizon: {warrantyDays} Days)
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
            {warrantyAssets?.length || 0} Assets Matching
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Asset Tag</th>
                <th className="px-6 py-3.5">Hardware Item & Model</th>
                <th className="px-6 py-3.5">Serial Number</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Warranty Expiration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isWarrantyLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    Scanning warranty horizons...
                  </td>
                </tr>
              ) : !warrantyAssets || warrantyAssets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    No hardware assets expiring within the {warrantyDays}-day window.
                  </td>
                </tr>
              ) : (
                warrantyAssets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-3.5 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {asset.assetTag}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                      {asset.name} <span className="text-[11px] text-slate-400 block">{asset.model}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {asset.serialNumber}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                      {asset.departmentId?.name || 'Operations'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-amber-600 dark:text-amber-400">
                      {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-sky-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Bulk CSV Hardware Ingestion</h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCsvSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  CSV Data (Header Row Required)
                </span>
                <button
                  type="button"
                  onClick={handleSampleCsv}
                  className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                >
                  Load Sample Template
                </button>
              </div>

              <textarea
                required
                rows="8"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Asset Name,Manufacturer,Model,Serial Number,Category Code,Department Code,Room..."
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />

              {importStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    importStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {importStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importMutation.isPending || !csvContent.trim()}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {importMutation.isPending ? 'Ingesting Batch...' : 'Process CSV Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Cpu,
  Layers,
  HardDrive,
  Monitor,
  Wifi,
  Terminal,
  History,
  Wrench,
  Clock,
  User,
  ShieldAlert,
  Server,
} from 'lucide-react';
import { api } from '../../services/api';

export function AssetDetailModal({ isOpen, onClose, assetId }) {
  const [activeTab, setActiveTab] = useState('specs');

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const res = await api.get(`/assets/${assetId}`);
      return res.data.data;
    },
    enabled: !!assetId && isOpen,
  });

  const { data: custodyHistory } = useQuery({
    queryKey: ['assignments', 'asset', assetId],
    queryFn: async () => {
      const res = await api.get(`/assignments?assetId=${assetId}`);
      return res.data.data;
    },
    enabled: !!assetId && isOpen && activeTab === 'custody',
  });

  if (!isOpen) return null;

  const specs = asset?.specifications || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 px-2 py-0.5 bg-sky-50 dark:bg-sky-950/50 rounded border border-sky-200 dark:border-sky-800">
                {asset?.assetTag || 'Loading...'}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                {asset?.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {asset?.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {asset?.manufacturer} • {asset?.model} • S/N: {asset?.serialNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'specs'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Hardware Architecture
          </button>
          <button
            onClick={() => setActiveTab('custody')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'custody'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Chain of Custody
          </button>
          <button
            onClick={() => setActiveTab('procurement')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'procurement'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Warranty & Financials
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading hardware schema...</div>
          ) : activeTab === 'specs' ? (
            <div className="space-y-6">
              {/* CPU Specs */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-sky-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Processor (CPU)</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Make & Model</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {specs.cpu?.manufacturer || 'Intel'} {specs.cpu?.model || 'Core i7'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cores & Threads</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {specs.cpu?.cores || 8} Cores / {specs.cpu?.threads || 16} Threads
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Base Clock</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {specs.cpu?.baseClockGhz ? `${specs.cpu.baseClockGhz} GHz` : '2.4 GHz'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Boost Clock</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {specs.cpu?.boostClockGhz ? `${specs.cpu.boostClockGhz} GHz` : '4.8 GHz'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Memory (RAM) Module Array */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Memory Configuration</h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded">
                    Total: {specs.ram?.totalCapacityGb || 16} GB
                  </span>
                </div>

                <div className="space-y-2">
                  {specs.ram?.modules && specs.ram.modules.length > 0 ? (
                    specs.ram.modules.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Slot {m.slot || idx + 1}: {m.capacityGb} GB DDR5
                        </span>
                        <span className="text-slate-500">
                          {m.speedMts ? `${m.speedMts} MT/s` : '4800 MT/s'} • {m.make || 'OEM'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">Standard 16GB Single-Channel Installed</div>
                  )}
                </div>
              </div>

              {/* Storage Drive Array */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Storage Volumes</h3>
                </div>

                <div className="space-y-2">
                  {specs.storage && specs.storage.length > 0 ? (
                    specs.storage.map((drive, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          Drive {idx + 1}: {drive.capacityGb} GB {drive.driveType || 'NVMe SSD'}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          S/N: {drive.serialNumber || 'N/A'} • {drive.manufacturer || 'OEM'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">512 GB M.2 NVMe SSD Installed</div>
                  )}
                </div>
              </div>

              {/* Motherboard & Networking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-4 h-4 text-purple-500" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Mainboard</h3>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <div>Model: {specs.motherboard?.model || 'OEM Custom Board'}</div>
                    <div>Socket: {specs.motherboard?.socket || 'LGA1700'}</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-4 h-4 text-sky-500" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Network Interfaces</h3>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    <div>MAC: {specs.networking?.macAddress || 'N/A'}</div>
                    <div>IP: {specs.networking?.ipAddress || 'DHCP Dynamic'}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'custody' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Immutable Custody Ledger (DEC-003)
              </h3>
              {custodyHistory && custodyHistory.length > 0 ? (
                <div className="space-y-3">
                  {custodyHistory.map((assignment) => (
                    <div
                      key={assignment._id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          Assigned to: {assignment.employeeId?.name || `${assignment.employeeId?.firstName} ${assignment.employeeId?.lastName}`}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Checked out: {new Date(assignment.assignedAt).toLocaleDateString()} • Handover Condition: {assignment.conditionAtHandover}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        assignment.status === 'Active'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-slate-400">
                  No previous assignment records for this hardware.
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block">Purchase Cost</span>
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    ₹{((asset?.purchaseCostMinor || 0) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Warranty Expiry</span>
                  <span className="font-bold text-base text-amber-600 dark:text-amber-400">
                    {asset?.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Department</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {asset?.departmentId?.name || 'General Operations'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {asset?.locationId?.building || 'Main Campus'} - {asset?.locationId?.room || 'HQ'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

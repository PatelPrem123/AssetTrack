import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  X,
  Boxes,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function MaintenancePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('open'); // 'open' or 'completed'
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [swapTicket, setSwapTicket] = useState(null);
  const [completeTicket, setCompleteTicket] = useState(null);

  // Create Ticket State
  const [ticketData, setTicketData] = useState({
    assetId: '',
    issueDescription: '',
    priority: 'Medium',
    category: 'Hardware Repair',
  });

  // Component Swap State (DEC-005)
  const [swapData, setSwapData] = useState({
    componentType: 'RAM',
    action: 'Upgrade',
    oldComponentDetails: '8GB DDR4 OEM Module',
    newPartStockItemId: '',
    newComponentDetails: 'Crucial 16GB DDR5 5600MT/s',
    costInr: '4800',
    reason: 'Performance bottleneck in development workflow',
    notes: 'Upgraded slot 1 module and bench-tested under stress test',
  });

  // Complete Ticket State
  const [closeData, setCloseData] = useState({
    diagnosis: 'Thermal paste dry and memory slot upgrade complete',
    actionTaken: 'Cleaned heatsink, swapped memory, ran stress-ng diagnostics',
    costInr: '4800',
    assetConditionAfterRepair: 'Good',
  });

  // Queries
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['maintenance', activeTab],
    queryFn: async () => {
      const url = activeTab === 'open' ? '/maintenance?status=Open' : '/maintenance';
      const res = await api.get(url);
      return res.data.data;
    },
  });

  const { data: assets } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: async () => {
      const res = await api.get('/assets?limit=100');
      return res.data.data;
    },
    enabled: isCreateOpen,
  });

  const { data: stockItems } = useQuery({
    queryKey: ['stock', 'items'],
    queryFn: async () => {
      const res = await api.get('/stock/items');
      return res.data.data;
    },
    enabled: !!swapTicket,
  });

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/maintenance', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsCreateOpen(false);
      setTicketData({
        assetId: '',
        issueDescription: '',
        priority: 'Medium',
        category: 'Hardware Repair',
      });
    },
  });

  const componentSwapMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.post(`/maintenance/${id}/component-change`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSwapTicket(null);
    },
  });

  const completeTicketMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.patch(`/maintenance/${id}/complete`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCompleteTicket(null);
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createTicketMutation.mutate(ticketData);
  };

  const handleSwapSubmit = (e) => {
    e.preventDefault();
    if (!swapTicket) return;
    const costMinor = Math.round(parseFloat(swapData.costInr || '0') * 100);
    componentSwapMutation.mutate({
      id: swapTicket._id,
      payload: {
        componentType: swapData.componentType,
        action: swapData.action,
        oldComponentDetails: swapData.oldComponentDetails,
        newPartStockItemId: swapData.newPartStockItemId || undefined,
        newComponentDetails: swapData.newComponentDetails,
        costMinor,
        reason: swapData.reason,
        notes: swapData.notes,
        // Provide updated specs structure for automatic asset synchronization (DEC-005)
        updatedHardwareSpecs: {
          ram: {
            totalCapacityGb: 16,
            modules: [{ slot: 1, capacityGb: 16, speedMts: 5600, make: 'Crucial' }],
          },
        },
      },
    });
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    if (!completeTicket) return;
    const costMinor = Math.round(parseFloat(closeData.costInr || '0') * 100);
    completeTicketMutation.mutate({
      id: completeTicket._id,
      payload: {
        diagnosis: closeData.diagnosis,
        actionTaken: closeData.actionTaken,
        costMinor,
        assetConditionAfterRepair: closeData.assetConditionAfterRepair,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Hardware Maintenance & Repair Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Diagnostic ticketing, atomic component swaps, and auto-syncing hardware specs (DEC-005)
          </p>
        </div>

        {['Admin', 'Asset Manager', 'Technician'].includes(user?.role) && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Maintenance Request
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('open')}
          className={`py-3 px-4 border-b-2 transition ${
            activeTab === 'open'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Work Orders
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-3 px-4 border-b-2 transition ${
            activeTab === 'completed'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Completed Repairs History
        </button>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Ticket #</th>
                <th className="px-6 py-3.5">Target Device</th>
                <th className="px-6 py-3.5">Reported Issue</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    Loading maintenance queue...
                  </td>
                </tr>
              ) : !tickets || tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No active maintenance tickets in queue.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {t.ticketNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {t.assetId?.assetTag || 'Device'}
                      </div>
                      <div className="text-[11px] text-slate-500">{t.assetId?.name}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                      {t.issueDescription}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.priority === 'High'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                            : t.priority === 'Critical'
                            ? 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.status !== 'Completed' && ['Admin', 'Technician'].includes(user?.role) && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSwapTicket(t)}
                            className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold text-xs rounded-lg hover:bg-sky-100 transition border border-sky-200 dark:border-sky-800 flex items-center gap-1"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            Swap Part
                          </button>
                          <button
                            onClick={() => setCompleteTicket(t)}
                            className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-lg hover:bg-emerald-100 transition border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Close
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Maintenance Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">New Maintenance Request</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Asset *
                </label>
                <select
                  required
                  value={ticketData.assetId}
                  onChange={(e) => setTicketData({ ...ticketData, assetId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                >
                  <option value="">Select asset requiring maintenance...</option>
                  {assets?.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.assetTag} - {a.name} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={ticketData.priority}
                    onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={ticketData.category}
                    onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                  >
                    <option value="Hardware Repair">Hardware Repair</option>
                    <option value="RAM Upgrade">RAM Upgrade</option>
                    <option value="Storage Replacement">Storage Replacement</option>
                    <option value="Screen Replacement">Screen Replacement</option>
                    <option value="Preventive Cleaning">Preventive Cleaning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Description & Diagnostic Symptoms *
                </label>
                <textarea
                  required
                  rows="3"
                  value={ticketData.issueDescription}
                  onChange={(e) => setTicketData({ ...ticketData, issueDescription: e.target.value })}
                  placeholder="Detail fault observations, BSOD codes, physical damage..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  {createTicketMutation.isPending ? 'Logging Ticket...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Component Swap Modal (DEC-005) */}
      {swapTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Component Swap & Evolution</h3>
                <p className="text-xs text-slate-500">
                  Ticket #{swapTicket.ticketNumber} • {swapTicket.assetId?.assetTag}
                </p>
              </div>
              <button onClick={() => setSwapTicket(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSwapSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Component Type
                  </label>
                  <select
                    value={swapData.componentType}
                    onChange={(e) => setSwapData({ ...swapData, componentType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="RAM">RAM Module</option>
                    <option value="SSD">SSD Drive</option>
                    <option value="HDD">HDD Drive</option>
                    <option value="GPU">Graphics Card</option>
                    <option value="Power Supply">Power Supply</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Action Performed
                  </label>
                  <select
                    value={swapData.action}
                    onChange={(e) => setSwapData({ ...swapData, action: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Upgrade">Upgrade</option>
                    <option value="Replace Faulty">Replace Faulty</option>
                    <option value="Add">Add New</option>
                    <option value="Remove">Remove Component</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Replaced (Old) Part Details
                </label>
                <input
                  type="text"
                  value={swapData.oldComponentDetails}
                  onChange={(e) => setSwapData({ ...swapData, oldComponentDetails: e.target.value })}
                  placeholder="e.g. 8GB DDR4 2666 OEM module (Defective)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Deduct Consumable from Stock Item */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Consumable from Stock (Atomic Deduction)
                </label>
                <select
                  value={swapData.newPartStockItemId}
                  onChange={(e) => setSwapData({ ...swapData, newPartStockItemId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Select stock consumable (or manual install)...</option>
                  {stockItems?.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.itemCode} - {item.name} ({item.currentQuantity} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Component Specifications & Serial
                </label>
                <input
                  type="text"
                  required
                  value={swapData.newComponentDetails}
                  onChange={(e) => setSwapData({ ...swapData, newComponentDetails: e.target.value })}
                  placeholder="Crucial 16GB DDR5 5600MT/s (SN: CR-998877)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Component Cost (INR)
                  </label>
                  <input
                    type="number"
                    value={swapData.costInr}
                    onChange={(e) => setSwapData({ ...swapData, costInr: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Swap Reason
                  </label>
                  <input
                    type="text"
                    value={swapData.reason}
                    onChange={(e) => setSwapData({ ...swapData, reason: e.target.value })}
                    placeholder="RAM failure / Capacity expansion"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSwapTicket(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={componentSwapMutation.isPending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  {componentSwapMutation.isPending ? 'Logging Swap...' : 'Commit Component Evolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Ticket Modal */}
      {completeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Close Maintenance Ticket</h3>
              <button onClick={() => setCompleteTicket(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Final Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  value={closeData.diagnosis}
                  onChange={(e) => setCloseData({ ...closeData, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corrective Actions Taken *
                </label>
                <textarea
                  required
                  rows="2"
                  value={closeData.actionTaken}
                  onChange={(e) => setCloseData({ ...closeData, actionTaken: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Repair Cost (INR)
                  </label>
                  <input
                    type="number"
                    value={closeData.costInr}
                    onChange={(e) => setCloseData({ ...closeData, costInr: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Post-Repair Condition
                  </label>
                  <select
                    value={closeData.assetConditionAfterRepair}
                    onChange={(e) => setCloseData({ ...closeData, assetConditionAfterRepair: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Good">Good (Ready for deployment)</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteTicket(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completeTicketMutation.isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  {completeTicketMutation.isPending ? 'Closing...' : 'Complete & Restore Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

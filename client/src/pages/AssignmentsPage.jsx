import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  PlusCircle,
  X,
  AlertCircle,
  Calendar,
  CheckSquare,
  Square,
  CornerDownLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function AssignmentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [returnAssignment, setReturnAssignment] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  // New Handover Form State
  const [checkoutData, setCheckoutData] = useState({
    assetId: '',
    employeeId: '',
    expectedReturnDate: '',
    conditionAtHandover: 'Good',
    notes: '',
    accessories: [
      { name: 'Power Adapter / Charger', verified: true },
      { name: 'Laptop Backpack / Sleeve', verified: true },
      { name: 'USB-C Display Adapter', verified: false },
    ],
  });

  // Return Form State
  const [returnData, setReturnData] = useState({
    conditionAtReturn: 'Good',
    notes: '',
  });

  // Fetch Available Assets
  const { data: availableAssets } = useQuery({
    queryKey: ['assets', 'available'],
    queryFn: async () => {
      const res = await api.get('/assets?status=Available&limit=100');
      return res.data.data;
    },
    enabled: isCheckoutOpen,
  });

  // Fetch Users / Employees
  const { data: usersList } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/auth/users');
      return res.data.data;
    },
    enabled: isCheckoutOpen,
  });

  // Fetch Assignments List
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', activeTab],
    queryFn: async () => {
      const url = activeTab === 'active' ? '/assignments?status=Active' : '/assignments';
      const res = await api.get(url);
      return res.data.data;
    },
  });

  // Mutations
  const checkoutMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/assignments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsCheckoutOpen(false);
      setCheckoutData({
        assetId: '',
        employeeId: '',
        expectedReturnDate: '',
        conditionAtHandover: 'Good',
        notes: '',
        accessories: [
          { name: 'Power Adapter / Charger', verified: true },
          { name: 'Laptop Backpack / Sleeve', verified: true },
          { name: 'USB-C Display Adapter', verified: false },
        ],
      });
    },
  });

  const returnMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.patch(`/assignments/${id}/return`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setReturnAssignment(null);
    },
  });

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    checkoutMutation.mutate(checkoutData);
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!returnAssignment) return;
    returnMutation.mutate({
      id: returnAssignment._id,
      payload: returnData,
    });
  };

  const toggleAccessory = (index) => {
    const updated = [...checkoutData.accessories];
    updated[index].verified = !updated[index].verified;
    setCheckoutData({ ...checkoutData, accessories: updated });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Chain of Custody & Device Handovers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable assignment ledger, accessories verification, and return inspection (DEC-003)
          </p>
        </div>

        {['Admin', 'Asset Manager', 'Technician'].includes(user?.role) && (
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Check Out Hardware
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 px-4 border-b-2 transition ${
            activeTab === 'active'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Deployments
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-4 border-b-2 transition ${
            activeTab === 'history'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Historical Audit Trail
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Asset Tag & Device</th>
                <th className="px-6 py-3.5">Assigned Employee</th>
                <th className="px-6 py-3.5">Handover Date</th>
                <th className="px-6 py-3.5">Expected Return</th>
                <th className="px-6 py-3.5">Handover Condition</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    Loading custody records...
                  </td>
                </tr>
              ) : !assignments || assignments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No assignment records found.
                  </td>
                </tr>
              ) : (
                assignments.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {row.assetId?.assetTag || 'AST-N/A'}
                      </div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {row.assetId?.name || 'Device'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {row.employeeId?.name || `${row.employeeId?.firstName} ${row.employeeId?.lastName}`}
                      </div>
                      <div className="text-[11px] text-slate-400">{row.employeeId?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(row.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {row.expectedReturnDate
                        ? new Date(row.expectedReturnDate).toLocaleDateString()
                        : 'Indefinite'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {row.conditionAtHandover}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.status === 'Active'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.status === 'Active' && ['Admin', 'Asset Manager', 'Technician'].includes(user?.role) && (
                        <button
                          onClick={() => setReturnAssignment(row)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-lg transition border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 ml-auto"
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" />
                          Return Device
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Check Out Hardware Asset</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Available Asset *
                </label>
                <select
                  required
                  value={checkoutData.assetId}
                  onChange={(e) => setCheckoutData({ ...checkoutData, assetId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                >
                  <option value="">Select an available device...</option>
                  {availableAssets?.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.assetTag} - {a.name} ({a.serialNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign To Employee *
                </label>
                <select
                  required
                  value={checkoutData.employeeId}
                  onChange={(e) => setCheckoutData({ ...checkoutData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                >
                  <option value="">Select employee...</option>
                  {usersList?.map((u) => (
                    <option key={u.id || u._id} value={u.id || u._id}>
                      {u.name} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    value={checkoutData.expectedReturnDate}
                    onChange={(e) => setCheckoutData({ ...checkoutData, expectedReturnDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Handover Condition
                  </label>
                  <select
                    value={checkoutData.conditionAtHandover}
                    onChange={(e) => setCheckoutData({ ...checkoutData, conditionAtHandover: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                  >
                    <option value="New">New (Factory Sealed)</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              {/* Accessories Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Included Accessories Checklist
                </label>
                <div className="space-y-2">
                  {checkoutData.accessories.map((acc, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleAccessory(idx)}
                      className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      {acc.verified ? (
                        <CheckSquare className="w-4 h-4 text-sky-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{acc.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Handover Notes
                </label>
                <textarea
                  rows="2"
                  value={checkoutData.notes}
                  onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                  placeholder="Deployment instructions, purpose of handover..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkoutMutation.isPending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  {checkoutMutation.isPending ? 'Confirming Handover...' : 'Confirm Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Return & Inspection</h3>
              <button
                onClick={() => setReturnAssignment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {returnAssignment.assetId?.assetTag}
                </div>
                <div className="font-medium text-slate-900 dark:text-white mt-0.5">
                  {returnAssignment.assetId?.name}
                </div>
                <div className="text-slate-500 mt-1">
                  Returning from:{' '}
                  {returnAssignment.employeeId?.name ||
                    `${returnAssignment.employeeId?.firstName} ${returnAssignment.employeeId?.lastName}`}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condition Upon Return *
                </label>
                <select
                  value={returnData.conditionAtReturn}
                  onChange={(e) => setReturnData({ ...returnData, conditionAtReturn: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                >
                  <option value="Good">Good (Ready for redeployment)</option>
                  <option value="Fair">Fair (Minor wear, cleaning needed)</option>
                  <option value="Poor">Poor (Needs hardware inspection/repair)</option>
                  <option value="Damaged">Damaged (Faulty components)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Inspection Notes
                </label>
                <textarea
                  rows="2"
                  value={returnData.notes}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  placeholder="Physical inspection notes, accessories verified..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnAssignment(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnMutation.isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  {returnMutation.isPending ? 'Processing Return...' : 'Accept Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

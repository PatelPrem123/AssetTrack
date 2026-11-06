import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Boxes,
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  History,
  Layers,
  HardDrive,
  Cpu,
  LogIn,
  RefreshCw,
  User,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function InventoryPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const isMovementsTab = location.pathname.includes('/movements');

  const { user, setUser } = useAuthStore();
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [movementItem, setMovementItem] = useState(null);
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
      console.error('Quick login failed:', err);
    } finally {
      setQuickLoginLoading(false);
    }
  };

  // New Item State
  const [itemData, setItemData] = useState({
    itemCode: '',
    name: '',
    category: 'RAM',
    unit: 'pcs',
    currentQuantity: 10,
    minStockLevel: 5,
    unitCostInr: '4500',
    location: 'Warehouse Shelf A-2',
  });

  // Movement State
  const [movementData, setMovementData] = useState({
    movementType: 'IN', // IN, OUT, ADJUST
    quantity: 5,
    unitCostInr: '4500',
    referenceNumber: 'PO-2026-001',
    notes: 'Warehouse batch replenishment',
  });

  // Queries
  const { data: stockItems, isLoading: isItemsLoading } = useQuery({
    queryKey: ['stock', 'items'],
    queryFn: async () => {
      const res = await api.get('/stock/items');
      return res.data.data;
    },
    enabled: !isMovementsTab,
  });

  const { data: stockMovements, isLoading: isMovementsLoading } = useQuery({
    queryKey: ['stock', 'movements'],
    queryFn: async () => {
      const res = await api.get('/stock/movements');
      return res.data.data;
    },
    enabled: isMovementsTab,
  });

  // Mutations
  const addItemMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/stock/items', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsAddItemOpen(false);
      setItemData({
        itemCode: '',
        name: '',
        category: 'RAM',
        unit: 'pcs',
        currentQuantity: 10,
        minStockLevel: 5,
        unitCostInr: '4500',
        location: 'Warehouse Shelf A-2',
      });
    },
  });

  const recordMovementMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/stock/movements', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setMovementItem(null);
    },
  });

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    const unitCostMinor = Math.round(parseFloat(itemData.unitCostInr || '0') * 100);
    addItemMutation.mutate({
      ...itemData,
      unitCostMinor,
    });
  };

  const handleMovementSubmit = (e) => {
    e.preventDefault();
    if (!movementItem) return;
    const unitCostMinor = Math.round(parseFloat(movementData.unitCostInr || '0') * 100);
    recordMovementMutation.mutate({
      stockItemId: movementItem._id,
      movementType: movementData.movementType,
      quantity: Number(movementData.quantity),
      unitCostMinor,
      referenceNumber: movementData.referenceNumber,
      notes: movementData.notes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {isMovementsTab ? (
              <>
                <History className="w-6 h-6 text-sky-500" />
                <span>Stock Movements & Material Audit Ledger</span>
              </>
            ) : (
              <>
                <Boxes className="w-6 h-6 text-sky-500" />
                <span>Spare Parts & Consumables Catalog</span>
              </>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isMovementsTab
              ? 'Append-only ledger of batch replenishments, technician repair issues, and inventory reconciliations (DEC-006)'
              : 'Dual-tier inventory tracking, non-negative stock safety, and reorder threshold management (DEC-006)'}
          </p>
        </div>

        {!isMovementsTab && ['Admin', 'Asset Manager', 'Technician'].includes(user?.role) && (
          <button
            onClick={() => setIsAddItemOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Add Consumable Part
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => navigate('/inventory')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            !isMovementsTab
              ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Spare Parts Catalog ({stockItems?.length || 0})</span>
        </button>
        <button
          onClick={() => navigate('/inventory/movements')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            isMovementsTab
              ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Movements Ledger ({stockMovements?.length || 0})</span>
        </button>
      </div>

      {/* Guest Mode Warning Banner */}
      {!user && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Active Session Required</p>
              <p className="text-slate-600 dark:text-slate-400">
                You are currently in guest mode. Sign in to view stock inventory, low-threshold alerts, and record movements.
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

      {/* View 1: Catalog Table (When on /inventory) */}
      {!isMovementsTab && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Part Code</th>
                  <th className="px-6 py-3.5">Consumable Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Available Stock</th>
                  <th className="px-6 py-3.5">Reorder Threshold</th>
                  <th className="px-6 py-3.5">Unit Value</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isItemsLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      Loading consumables catalog...
                    </td>
                  </tr>
                ) : !stockItems || stockItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      {!user
                        ? 'Please sign in with an Administrator or Technician account to view spare parts stock.'
                        : 'No spare parts recorded in catalog.'}
                    </td>
                  </tr>
                ) : (
                  stockItems.map((item) => {
                    const isLow = item.currentQuantity <= item.minStockLevel;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                          {item.itemCode}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-400">{item.location || 'Warehouse'}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 whitespace-nowrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                              {item.currentQuantity} {item.unit}
                            </span>
                            {isLow && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 rounded-full whitespace-nowrap shrink-0 border border-rose-200 dark:border-rose-800">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Low Stock</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {item.minStockLevel} {item.unit}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          ₹{((item.unitCostMinor || 0) / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {['Admin', 'Asset Manager', 'Technician'].includes(user?.role) && (
                            <button
                              onClick={() => setMovementItem(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition flex items-center gap-1 ml-auto"
                            >
                              <History className="w-3.5 h-3.5 text-sky-500" />
                              Record Movement
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Movements & Audit Ledger Table (When on /inventory/movements) */}
      {isMovementsTab && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Action Type</th>
                  <th className="px-6 py-3.5">SKU / Part Item</th>
                  <th className="px-6 py-3.5">Quantity Delta</th>
                  <th className="px-6 py-3.5">Stock Progression</th>
                  <th className="px-6 py-3.5">Reference / Notes</th>
                  <th className="px-6 py-3.5">Performed By</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isMovementsLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      Loading movements ledger...
                    </td>
                  </tr>
                ) : !stockMovements || stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      {!user
                        ? 'Please sign in to view stock movement audit history.'
                        : 'No stock movements recorded yet. Use "Record Movement" on any catalog item.'}
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((m) => {
                    const isIncoming = m.movementType === 'IN';
                    const isOutgoing = m.movementType === 'OUT';

                    return (
                      <tr key={m._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isIncoming
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : isOutgoing
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                : 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                            }`}
                          >
                            {isIncoming ? (
                              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                            ) : isOutgoing ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                            )}
                            <span>{m.movementType === 'IN' ? 'Stock In' : m.movementType === 'OUT' ? 'Stock Out' : 'Adjustment'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-sky-600 dark:text-sky-400">
                            {m.stockItemId?.itemCode || 'PART-SKU'}
                          </div>
                          <div className="text-slate-900 dark:text-white font-medium">
                            {m.stockItemId?.name || 'Consumable Item'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isIncoming
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isOutgoing
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isIncoming ? `+${m.quantity}` : isOutgoing ? `-${m.quantity}` : `±${m.quantity}`}{' '}
                            {m.stockItemId?.unit || 'pcs'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          <span>{m.previousQuantity}</span>
                          <span className="text-slate-400 mx-1.5">→</span>
                          <span className="font-bold text-slate-900 dark:text-white">{m.newQuantity} {m.stockItemId?.unit || 'pcs'}</span>
                        </td>
                        <td className="px-6 py-4">
                          {m.referenceId && (
                            <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                              {m.referenceId}
                            </span>
                          )}
                          <span className="text-slate-600 dark:text-slate-300 text-xs">{m.notes || 'Batch ledger transaction'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{m.performedBy?.name || 'IT Staff'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap text-slate-500 text-[11px]">
                          {new Date(m.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Consumable Modal */}
      {isAddItemOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Spare Part / Consumable</h3>
              <button onClick={() => setIsAddItemOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Part / SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemData.itemCode}
                    onChange={(e) => setItemData({ ...itemData, itemCode: e.target.value.toUpperCase() })}
                    placeholder="RAM-DDR5-16G"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={itemData.category}
                    onChange={(e) => setItemData({ ...itemData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="RAM">RAM</option>
                    <option value="SSD">SSD</option>
                    <option value="HDD">HDD</option>
                    <option value="Cables">Cables</option>
                    <option value="Thermal Paste">Thermal Paste</option>
                    <option value="Power Supply">Power Supply</option>
                    <option value="Peripherals">Peripherals</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Consumable Part Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemData.name}
                  onChange={(e) => setItemData({ ...itemData, name: e.target.value })}
                  placeholder="Crucial 16GB DDR5 5600MT/s SODIMM"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Stock
                  </label>
                  <input
                    type="number"
                    value={itemData.currentQuantity}
                    onChange={(e) => setItemData({ ...itemData, currentQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={itemData.minStockLevel}
                    onChange={(e) => setItemData({ ...itemData, minStockLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Cost (INR)
                  </label>
                  <input
                    type="number"
                    value={itemData.unitCostInr}
                    onChange={(e) => setItemData({ ...itemData, unitCostInr: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addItemMutation.isPending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  {addItemMutation.isPending ? 'Cataloging Part...' : 'Add Consumable'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Record Stock Movement Modal */}
      {movementItem && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Record Stock Movement</h3>
                <p className="text-xs text-slate-500">
                  {movementItem.itemCode} • Currently {movementItem.currentQuantity} in stock
                </p>
              </div>
              <button onClick={() => setMovementItem(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Movement Type *
                  </label>
                  <select
                    value={movementData.movementType}
                    onChange={(e) => setMovementData({ ...movementData, movementType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="IN">IN (Receive / Purchase)</option>
                    <option value="OUT">OUT (Issue / Consume)</option>
                    <option value="ADJUST">ADJUST (Audit Count)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity ({movementItem.unit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movementData.quantity}
                    onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference # (PO, Ticket, or Receipt)
                </label>
                <input
                  type="text"
                  value={movementData.referenceNumber}
                  onChange={(e) => setMovementData({ ...movementData, referenceNumber: e.target.value })}
                  placeholder="PO-2026-101"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Movement Reason / Audit Note
                </label>
                <textarea
                  rows="2"
                  value={movementData.notes}
                  onChange={(e) => setMovementData({ ...movementData, notes: e.target.value })}
                  placeholder="Stock replenishment, batch inspection..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMovementItem(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordMovementMutation.isPending}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  {recordMovementMutation.isPending ? 'Committing...' : 'Commit Movement'}
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

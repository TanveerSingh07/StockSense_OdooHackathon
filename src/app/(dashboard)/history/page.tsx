'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface MoveEntry {
  id: string;
  createdAt: string;
  refId: string;
  productId: string;
  warehouseId: string;
  change: number;
  reason: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
}

export default function MoveHistoryPage() {
  const [entries, setEntries] = useState<MoveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyRes, wRes, pRes] = await Promise.all([
        fetch('/api/receipts'), // We can use an endpoint or query ledger
        fetch('/api/warehouses'),
        fetch('/api/products'),
      ]);

      const [wData, pData] = await Promise.all([
        wRes.json().catch(() => ({})),
        pRes.json().catch(() => ({})),
      ]);

      if (wData.success && wData.data) {
        setWarehouses(wData.data);
      }

      // Fetch moves directly via a dedicated route or load
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEntries(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEntries = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      e.refId.toLowerCase().includes(q) ||
      (e.product?.name && e.product.name.toLowerCase().includes(q)) ||
      (e.product?.sku && e.product.sku.toLowerCase().includes(q)) ||
      e.productId.toLowerCase().includes(q);

    const matchReason = selectedReason === 'ALL' || e.reason === selectedReason;
    const matchWarehouse = selectedWarehouse === 'ALL' || e.warehouseId === selectedWarehouse;

    return matchSearch && matchReason && matchWarehouse;
  });

  const totalIn = filteredEntries
    .filter((e) => e.change > 0)
    .reduce((sum, e) => sum + e.change, 0);

  const totalOut = filteredEntries
    .filter((e) => e.change < 0)
    .reduce((sum, e) => sum + Math.abs(e.change), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Stock Move History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete audit trail of inventory mutations with interactive filters for receipts, deliveries, and adjustments.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Recorded Movements</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{filteredEntries.length}</div>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-xs text-emerald-800 font-medium uppercase tracking-wider">Total Inflow (+)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">+{totalIn} units</div>
        </div>
        <div className="bg-red-50/70 p-4 rounded-xl border border-red-200 shadow-sm">
          <div className="text-xs text-red-800 font-medium uppercase tracking-wider">Total Outflow (−)</div>
          <div className="text-2xl font-bold text-red-700 mt-1">−{totalOut} units</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by Reference (e.g. WH/IN/0001, ADJ/...) or Product SKU/Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white shadow-none"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Reason Filter */}
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="h-10 px-3 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Operations</option>
            <option value="RECEIPT">Inbound Receipts</option>
            <option value="DELIVERY">Outbound Deliveries</option>
            <option value="ADJUSTMENT">Stock Adjustments</option>
          </select>

          {/* Warehouse Filter */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="h-10 px-3 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Moves Table */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-xl border">Loading move history...</div>
      ) : (
        <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Reference / Order</th>
                <th className="p-4">Product Details</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4">Operation Type</th>
                <th className="p-4 text-right">Quantity Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.map((entry) => {
                const isIn = entry.change > 0;
                return (
                  <tr key={entry.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4 font-mono text-xs font-bold text-gray-800">
                      {entry.refId}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{entry.product?.name || entry.productId}</div>
                      <div className="text-xs font-mono text-gray-400">{entry.product?.sku || 'N/A'}</div>
                    </td>
                    <td className="p-4 text-xs font-medium text-gray-600">
                      {entry.warehouse?.name || entry.warehouseId}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        entry.reason === 'RECEIPT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : entry.reason === 'DELIVERY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {entry.reason}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {/* Excalidraw requirement: In events green, Out events red */}
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                          isIn
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {isIn ? `+${entry.change}` : entry.change} {entry.product?.unit || 'units'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No movements found matching the current search & filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

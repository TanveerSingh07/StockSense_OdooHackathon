'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
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
      const [wRes, hRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/history'),
      ]);

      const [wData, hData] = await Promise.all([
        wRes.json().catch(() => ({})),
        hRes.json().catch(() => ({})),
      ]);

      if (wData.success && wData.data) {
        setWarehouses(wData.data);
      }

      if (hData.success && hData.data) {
        setEntries(hData.data);
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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-[#dae2fd]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#ffc174]/10 text-[#ffc174] border border-[#ffc174]/20">
              <History className="w-4 h-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dae2fd]">Stock Move History</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
            Complete audit trail of inventory mutations with interactive filters for receipts, deliveries, and adjustments.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449]/70 shadow-sm">
          <div className="text-xs text-[#94a3b8] font-medium uppercase tracking-wider">Total Recorded Movements</div>
          <div className="text-2xl font-bold text-[#dae2fd] mt-1">{filteredEntries.length}</div>
        </div>
        <div className="bg-[#ffc174]/10 p-4 rounded-xl border border-[#ffc174]/20 shadow-sm">
          <div className="text-xs text-[#ffc174] font-medium uppercase tracking-wider flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Total Inflow (+)
          </div>
          <div className="text-2xl font-bold text-[#ffd49d] mt-1">+{totalIn} units</div>
        </div>
        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 shadow-sm">
          <div className="text-xs text-red-400 font-medium uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Total Outflow (−)
          </div>
          <div className="text-2xl font-bold text-red-300 mt-1">−{totalOut} units</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449]/70 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by Reference (e.g. WH/IN/0001, ADJ/...) or Product SKU/Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0b1326] border-[#2d3449]/70 text-[#dae2fd] text-xs placeholder-[#6b7280]"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Reason Filter */}
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="h-9 px-3 text-xs bg-[#0b1326] border border-[#2d3449]/70 rounded-lg text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#ffc174]/20 focus:border-[#ffc174] transition-colors"
          >
            <option value="ALL" className="bg-[#131b2e] text-[#dae2fd]">All Operations</option>
            <option value="RECEIPT" className="bg-[#131b2e] text-[#dae2fd]">Inbound Receipts</option>
            <option value="DELIVERY" className="bg-[#131b2e] text-[#dae2fd]">Outbound Deliveries</option>
            <option value="ADJUSTMENT" className="bg-[#131b2e] text-[#dae2fd]">Stock Adjustments</option>
          </select>

          {/* Warehouse Filter */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="h-9 px-3 text-xs bg-[#0b1326] border border-[#2d3449]/70 rounded-lg text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#ffc174]/20 focus:border-[#ffc174] transition-colors"
          >
            <option value="ALL" className="bg-[#131b2e] text-[#dae2fd]">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id} className="bg-[#131b2e] text-[#dae2fd]">
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Moves Table */}
      {loading ? (
        <div className="p-12 text-center text-[#94a3b8] bg-[#131b2e] rounded-xl border border-[#2d3449]/70">
          Loading move history...
        </div>
      ) : (
        <div className="border border-[#2d3449]/70 rounded-xl bg-[#131b2e] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2d3449]/70 bg-[#131b2e]/60 text-[#94a3b8] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Reference / Order</th>
                  <th className="p-3.5">Product Details</th>
                  <th className="p-3.5">Warehouse</th>
                  <th className="p-3.5">Operation Type</th>
                  <th className="p-3.5 text-right">Quantity Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3449]/50">
                {filteredEntries.map((entry) => {
                  const isIn = entry.change > 0;
                  return (
                    <tr key={entry.id} className="hover:bg-[#171f33]/60 transition-colors">
                      <td className="p-3.5 text-[#94a3b8] whitespace-nowrap text-[11px] font-mono">
                        {new Date(entry.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] font-bold text-[#dae2fd]">
                        {entry.refId}
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-[#dae2fd]">{entry.product?.name || entry.productId}</div>
                        <div className="text-[11px] font-mono text-[#94a3b8]">{entry.product?.sku || 'N/A'}</div>
                      </td>
                      <td className="p-3.5 text-[#b4c6d4]">
                        {entry.warehouse?.name || entry.warehouseId}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${
                          entry.reason === 'RECEIPT'
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            : entry.reason === 'DELIVERY'
                            ? 'bg-[#ffc174]/10 text-[#ffd49d] border-[#ffc174]/20'
                            : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        }`}>
                          {entry.reason}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border ${
                            isIn
                              ? 'bg-[#ffc174]/10 text-[#ffd49d] border-[#ffc174]/20'
                              : 'bg-red-500/10 text-red-300 border-red-500/20'
                          }`}
                        >
                          {isIn ? '+' : ''}{entry.change} {entry.product?.unit || 'units'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#94a3b8]">
                      No movements found matching the current search & filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  Plus, 
  Search, 
  RefreshCw, 
  Warehouse, 
  AlertTriangle,
  LayoutList,
  LayoutGrid
} from 'lucide-react';

interface DeliveryLine {
  id: string;
  productId: string;
  quantity: number;
  availableStock?: number;
  isSufficient?: boolean;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

interface DeliveryItem {
  id: string;
  reference: string;
  customer: string;
  warehouseId: string;
  warehouseName: string;
  status: 'DRAFT' | 'DONE';
  displayStatus: 'DRAFT' | 'WAITING' | 'READY' | 'DONE';
  hasInsufficientStock: boolean;
  lines: DeliveryLine[];
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deliveries');
      const data = await res.json();
      if (data.success && data.data) {
        setDeliveries(data.data);
      }
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleValidate = async (deliveryId: string) => {
    try {
      setValidatingId(deliveryId);
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to validate delivery');
      }
      await fetchDeliveries();
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setValidatingId(null);
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const q = search.toLowerCase();
    const refMatch = d.reference?.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
    const customerMatch = d.customer?.toLowerCase().includes(q) || false;
    return refMatch || customerMatch;
  });

  const waitingDeliveries = filteredDeliveries.filter((d) => d.displayStatus === 'WAITING' && d.status !== 'DONE');
  const readyDeliveries = filteredDeliveries.filter((d) => (d.displayStatus === 'READY' || d.displayStatus === 'DRAFT') && d.status !== 'DONE' && !d.hasInsufficientStock);
  const doneDeliveries = filteredDeliveries.filter((d) => d.status === 'DONE');

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-[#dae2fd]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dae2fd]">Outbound Delivery Orders</h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">Manage picking, packing, stock dispatch, and customer deliveries.</p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* View switcher */}
          <div className="flex bg-[#131b2e] p-1 rounded-lg border border-[#2d3449]/70">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-[#2d3449]/40 text-[#dae2fd] shadow-xs'
                  : 'text-[#94a3b8] hover:text-[#dae2fd]'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-[#2d3449]/40 text-[#dae2fd] shadow-xs'
                  : 'text-[#94a3b8] hover:text-[#dae2fd]'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <Link href="/deliveries/new">
            <button className="h-9 px-4 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-lg shadow-sm shadow-[#ffc174]/20 transition-all flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>New Delivery</span>
            </button>
          </Link>
        </div>
      </div>

      {/* KPI mini-bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449]/70 shadow-sm">
          <div className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider">Total Dispatches</div>
          <div className="text-2xl font-bold text-[#dae2fd] mt-1">{deliveries.length}</div>
        </div>
        <div className="bg-amber-500/[0.04] p-4 rounded-xl border border-amber-500/20 shadow-sm">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Waiting for Stock</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{waitingDeliveries.length}</div>
        </div>
        <div className="bg-sky-500/[0.04] p-4 rounded-xl border border-sky-500/20 shadow-sm">
          <div className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">Ready to Deliver</div>
          <div className="text-2xl font-bold text-sky-300 mt-1">{readyDeliveries.length}</div>
        </div>
        <div className="bg-[#ffc174]/[0.04] p-4 rounded-xl border border-[#ffc174]/20 shadow-sm">
          <div className="text-[11px] font-medium text-[#ffc174] uppercase tracking-wider">Delivered / Done</div>
          <div className="text-2xl font-bold text-[#ffd49d] mt-1">{doneDeliveries.length}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            placeholder="Search by Reference (e.g. WH/OUT/0001) or Customer / Contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9.5 pl-10 pr-4 text-xs bg-[#131b2e] border border-[#2d3449]/70 rounded-lg text-[#dae2fd] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#ffc174]/20 focus:border-[#ffc174] transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-[#94a3b8] bg-[#131b2e] rounded-xl border border-[#2d3449]/70">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#ffc174] mb-2" />
          <span>Loading delivery orders...</span>
        </div>
      ) : viewMode === 'list' ? (
        /* List Table View */
        <div className="border border-[#2d3449]/70 rounded-xl bg-[#131b2e] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2d3449]/70 bg-[#131b2e]/60 text-[#94a3b8] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5">Customer / Destination</th>
                  <th className="p-3.5">Warehouse</th>
                  <th className="p-3.5">Pick Items</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3449]/50">
                {filteredDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-[#171f33]/60 transition">
                    <td className="p-3.5">
                      <Link href={`/deliveries/${d.id}`} className="font-mono text-xs font-semibold text-[#ffc174] hover:underline">
                        {d.reference}
                      </Link>
                    </td>
                    <td className="p-3.5 font-medium text-[#dae2fd]">{d.customer || 'Direct Dispatch'}</td>
                    <td className="p-3.5 text-[#b4c6d4]">{d.warehouseName}</td>
                    <td className="p-3.5 text-[#b4c6d4]">
                      <span className="font-semibold text-[#dae2fd]">{d.lines.length}</span> line(s) (
                      {d.lines.reduce((sum, l) => sum + l.quantity, 0)} units)
                    </td>
                    <td className="p-3.5">
                      {d.status === 'DONE' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/30">
                          ✓ DELIVERED
                        </span>
                      ) : d.hasInsufficientStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="h-3 w-3" />
                          WAITING (DEFICIT)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          READY TO DISPATCH
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {d.status === 'DRAFT' ? (
                        <button
                          onClick={() => handleValidate(d.id)}
                          disabled={validatingId === d.id || d.hasInsufficientStock}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-lg shadow-sm transition cursor-pointer disabled:opacity-40"
                          title={d.hasInsufficientStock ? 'Cannot validate: insufficient warehouse stock' : 'Validate & decrement stock'}
                        >
                          {validatingId === d.id ? 'Validating...' : 'Validate'}
                        </button>
                      ) : (
                        <Link href={`/deliveries/${d.id}`}>
                          <button className="px-3 py-1.5 text-xs font-medium text-[#b4c6d4] hover:text-[#dae2fd] bg-[#131b2e] hover:bg-[#222a3d] border border-[#2d3449]/70 rounded-lg transition cursor-pointer">
                            View Details
                          </button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#94a3b8]">
                      No delivery orders found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Waiting Column */}
          <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449]/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d3449]/70">
              <span className="font-semibold text-xs text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                WAITING FOR STOCK
              </span>
              <span className="text-[11px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/20">
                {waitingDeliveries.length}
              </span>
            </div>

            <div className="space-y-3">
              {waitingDeliveries.map((d) => (
                <div
                  key={d.id}
                  className="bg-[#0b1326] p-4 rounded-lg border border-amber-500/20 shadow-sm hover:border-amber-500/40 transition flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <Link href={`/deliveries/${d.id}`} className="font-mono text-xs font-bold text-[#ffc174] hover:underline">
                        {d.reference}
                      </Link>
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                        Stock Deficit
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#dae2fd]">{d.customer || 'Direct Dispatch'}</div>
                    <div className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                      <Warehouse className="h-3 w-3" />
                      <span>{d.warehouseName}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2d3449]/50 flex items-center justify-between">
                    <span className="text-[10px] text-[#94a3b8] font-mono">{d.lines.length} lines</span>
                    <Link
                      href={`/deliveries/${d.id}`}
                      className="text-xs text-amber-400 hover:underline font-medium"
                    >
                      Check stock →
                    </Link>
                  </div>
                </div>
              ))}
              {waitingDeliveries.length === 0 && (
                <div className="text-center py-8 text-xs text-[#94a3b8] border border-dashed border-[#2d3449]/70 rounded-lg">
                  No orders blocked by deficit.
                </div>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449]/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d3449]/70">
              <span className="font-semibold text-xs text-sky-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
                READY TO DELIVER
              </span>
              <span className="text-[11px] bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-500/20">
                {readyDeliveries.length}
              </span>
            </div>

            <div className="space-y-3">
              {readyDeliveries.map((d) => (
                <div
                  key={d.id}
                  className="bg-[#0b1326] p-4 rounded-lg border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <Link href={`/deliveries/${d.id}`} className="font-mono text-xs font-bold text-[#ffc174] hover:underline">
                        {d.reference}
                      </Link>
                      <span className="text-[10px] text-[#94a3b8] font-mono">
                        {d.lines.reduce((acc, l) => acc + l.quantity, 0)} units
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#dae2fd]">{d.customer || 'Direct Dispatch'}</div>
                    <div className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                      <Warehouse className="h-3 w-3" />
                      <span>{d.warehouseName}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2d3449]/50 flex items-center justify-between">
                    <span className="text-[10px] text-[#94a3b8] font-mono">{d.lines.length} lines</span>
                    <button
                      onClick={() => handleValidate(d.id)}
                      disabled={validatingId === d.id}
                      className="px-3 py-1 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-md transition cursor-pointer"
                    >
                      {validatingId === d.id ? 'Validating...' : 'Validate'}
                    </button>
                  </div>
                </div>
              ))}
              {readyDeliveries.length === 0 && (
                <div className="text-center py-8 text-xs text-[#94a3b8] border border-dashed border-[#2d3449]/70 rounded-lg">
                  No orders ready for picking.
                </div>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449]/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d3449]/70">
              <span className="font-semibold text-xs text-[#ffc174] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ffc174]"></span>
                DELIVERED (DONE)
              </span>
              <span className="text-[11px] bg-[#ffc174]/15 text-[#ffd49d] px-2 py-0.5 rounded-full font-bold border border-[#ffc174]/20">
                {doneDeliveries.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneDeliveries.map((d) => (
                <div
                  key={d.id}
                  className="bg-[#0b1326] p-4 rounded-lg border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition flex flex-col justify-between gap-3 opacity-90 hover:opacity-100"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <Link href={`/deliveries/${d.id}`} className="font-mono text-xs font-bold text-[#ffc174] hover:underline">
                        {d.reference}
                      </Link>
                      <span className="text-[10px] text-[#ffc174] font-mono font-semibold">
                        ✓ DELIVERED
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#dae2fd]">{d.customer || 'Direct Dispatch'}</div>
                    <div className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                      <Warehouse className="h-3 w-3" />
                      <span>{d.warehouseName}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2d3449]/50 flex items-center justify-between">
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      {d.lines.reduce((acc, l) => acc + l.quantity, 0)} units dispatched
                    </span>
                    <Link
                      href={`/deliveries/${d.id}`}
                      className="text-xs text-[#ffc174] hover:text-[#ffd49d] hover:underline font-medium"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              ))}
              {doneDeliveries.length === 0 && (
                <div className="text-center py-8 text-xs text-[#94a3b8] border border-dashed border-[#2d3449]/70 rounded-lg">
                  No completed delivery records yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

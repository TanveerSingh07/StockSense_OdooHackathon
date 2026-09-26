'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowDownLeft, 
  Plus, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Warehouse, 
  Truck,
  LayoutList,
  LayoutGrid
} from 'lucide-react';

interface ReceiptLine {
  id: string;
  productId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

interface ReceiptItem {
  id: string;
  reference: string;
  supplierId: string;
  supplier?: {
    id: string;
    name: string;
  };
  warehouseId: string;
  warehouseName: string;
  status: 'DRAFT' | 'DONE';
  lines: ReceiptLine[];
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/receipts');
      const data = await res.json();
      if (data.success && data.data) {
        setReceipts(data.data);
      }
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleValidate = async (receiptId: string) => {
    try {
      setValidatingId(receiptId);
      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to validate receipt');
      }
      await fetchReceipts();
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setValidatingId(null);
    }
  };

  const filteredReceipts = receipts.filter(r => {
    const q = search.toLowerCase();
    const refMatch = r.reference?.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const supplierMatch = r.supplier?.name?.toLowerCase().includes(q) || false;
    return refMatch || supplierMatch;
  });

  const draftReceipts = filteredReceipts.filter(r => r.status === 'DRAFT');
  const doneReceipts = filteredReceipts.filter(r => r.status === 'DONE');

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-[#dae2fd]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dae2fd]">Inbound Receipts</h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">Manage vendor shipments, incoming stock verification, and ledger receipting.</p>
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

          <Link href="/receipts/new">
            <button className="h-9 px-4 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-lg shadow-sm shadow-[#ffc174]/20 transition-all flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>New Receipt</span>
            </button>
          </Link>
        </div>
      </div>

      {/* KPI mini-bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449]/70 shadow-sm">
          <div className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider">Total Inbound Runs</div>
          <div className="text-2xl font-bold text-[#dae2fd] mt-1">{receipts.length}</div>
        </div>
        <div className="bg-sky-500/[0.04] p-4 rounded-xl border border-sky-500/20 shadow-sm">
          <div className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">To Receive / Ready</div>
          <div className="text-2xl font-bold text-sky-300 mt-1">{draftReceipts.length}</div>
        </div>
        <div className="bg-[#ffc174]/[0.04] p-4 rounded-xl border border-[#ffc174]/20 shadow-sm">
          <div className="text-[11px] font-medium text-[#ffc174] uppercase tracking-wider">Received / Completed</div>
          <div className="text-2xl font-bold text-[#ffd49d] mt-1">{doneReceipts.length}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            placeholder="Search by Reference (e.g. WH/IN/0001) or Supplier / Contact..."
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
          <span>Loading inbound receipts...</span>
        </div>
      ) : viewMode === 'list' ? (
        /* List Table View */
        <div className="border border-[#2d3449]/70 rounded-xl bg-[#131b2e] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2d3449]/70 bg-[#131b2e]/60 text-[#94a3b8] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5">Receive From (Supplier)</th>
                  <th className="p-3.5">Warehouse</th>
                  <th className="p-3.5">Items / Lines</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3449]/50">
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-[#171f33]/60 transition">
                    <td className="p-3.5">
                      <Link href={`/receipts/${r.id}`} className="font-mono text-xs font-semibold text-sky-400 hover:underline">
                        {r.reference}
                      </Link>
                    </td>
                    <td className="p-3.5 font-medium text-[#dae2fd]">{r.supplier?.name || 'Unknown Supplier'}</td>
                    <td className="p-3.5 text-[#b4c6d4]">{r.warehouseName}</td>
                    <td className="p-3.5 text-[#b4c6d4]">
                      <span className="font-semibold text-[#dae2fd]">{r.lines.length}</span> line(s) (
                      {r.lines.reduce((sum, l) => sum + l.quantity, 0)} units)
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          r.status === 'DONE'
                            ? 'bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/30'
                            : 'bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/30'
                        }`}
                      >
                        {r.status === 'DONE' ? '✓ DONE' : 'READY / DRAFT'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {r.status === 'DRAFT' ? (
                        <button
                          onClick={() => handleValidate(r.id)}
                          disabled={validatingId === r.id}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                          {validatingId === r.id ? 'Validating...' : 'Validate'}
                        </button>
                      ) : (
                        <Link href={`/receipts/${r.id}`}>
                          <button className="px-3 py-1.5 text-xs font-medium text-[#b4c6d4] hover:text-[#dae2fd] bg-[#131b2e] hover:bg-[#222a3d] border border-[#2d3449]/70 rounded-lg transition cursor-pointer">
                            View Details
                          </button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#94a3b8]">
                      No receipts found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Draft / Ready Column */}
          <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449]/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d3449]/70">
              <span className="font-semibold text-xs text-amber-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                READY TO RECEIVE
              </span>
              <span className="text-[11px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/20">
                {draftReceipts.length}
              </span>
            </div>

            <div className="space-y-3">
              {draftReceipts.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#0b1326] p-4 rounded-lg border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <Link href={`/receipts/${r.id}`} className="font-mono text-xs font-bold text-sky-400 hover:underline">
                        {r.reference}
                      </Link>
                      <span className="text-[10px] text-[#94a3b8] font-mono">
                        {r.lines.reduce((acc, l) => acc + l.quantity, 0)} units
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#dae2fd]">{r.supplier?.name || 'Unknown Supplier'}</div>
                    <div className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                      <Warehouse className="h-3 w-3" />
                      <span>{r.warehouseName}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2d3449]/50 flex items-center justify-between">
                    <span className="text-[10px] text-[#94a3b8] font-mono">{r.lines.length} lines</span>
                    <button
                      onClick={() => handleValidate(r.id)}
                      disabled={validatingId === r.id}
                      className="px-3 py-1 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-md transition cursor-pointer"
                    >
                      {validatingId === r.id ? 'Validating...' : 'Validate'}
                    </button>
                  </div>
                </div>
              ))}
              {draftReceipts.length === 0 && (
                <div className="text-center py-8 text-xs text-[#94a3b8] border border-dashed border-[#2d3449]/70 rounded-lg">
                  No draft receipts waiting.
                </div>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-[#131b2e] p-4 rounded-xl border border-[#2d3449]/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d3449]/70">
              <span className="font-semibold text-xs text-[#ffc174] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ffc174]"></span>
                COMPLETED & STORED
              </span>
              <span className="text-[11px] bg-[#ffc174]/15 text-[#ffd49d] px-2 py-0.5 rounded-full font-bold border border-[#ffc174]/20">
                {doneReceipts.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneReceipts.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#0b1326] p-4 rounded-lg border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition flex flex-col justify-between gap-3 opacity-90 hover:opacity-100"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <Link href={`/receipts/${r.id}`} className="font-mono text-xs font-bold text-sky-400 hover:underline">
                        {r.reference}
                      </Link>
                      <span className="text-[10px] text-[#ffc174] font-mono flex items-center gap-1 font-semibold">
                        ✓ DONE
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#dae2fd]">{r.supplier?.name || 'Unknown Supplier'}</div>
                    <div className="text-[11px] text-[#94a3b8] flex items-center gap-1">
                      <Warehouse className="h-3 w-3" />
                      <span>{r.warehouseName}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2d3449]/50 flex items-center justify-between">
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      {r.lines.reduce((acc, l) => acc + l.quantity, 0)} units received
                    </span>
                    <Link
                      href={`/receipts/${r.id}`}
                      className="text-xs text-[#ffc174] hover:text-[#ffd49d] hover:underline font-medium"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              ))}
              {doneReceipts.length === 0 && (
                <div className="text-center py-8 text-xs text-[#94a3b8] border border-dashed border-[#2d3449]/70 rounded-lg">
                  No completed receipts yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      // Refresh list
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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inbound Receipts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor shipments, incoming stock verification, and ledger receipting.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Kanban View
            </button>
          </div>

          <Link href="/receipts/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              + New Receipt
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI mini-bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Inbound</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{receipts.length}</div>
        </div>
        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 shadow-sm">
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">To Receive / Ready</div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{draftReceipts.length}</div>
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Received / Done</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{doneReceipts.length}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Input
            placeholder="Search by Reference (e.g. WH/IN/0001) or Supplier / Contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-xl border">Loading receipts...</div>
      ) : viewMode === 'list' ? (
        /* List Table View */
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="p-4">Reference</th>
                <th className="p-4">Receive From (Supplier)</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4">Items / Lines</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReceipts.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4">
                    <Link href={`/receipts/${r.id}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
                      {r.reference}
                    </Link>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{r.supplier?.name || 'Unknown Supplier'}</td>
                  <td className="p-4 text-sm text-gray-600">{r.warehouseName}</td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{r.lines.length}</span> line(s) (
                    {r.lines.reduce((sum, l) => sum + l.quantity, 0)} units)
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === 'DONE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {r.status === 'DONE' ? '✓ DONE' : 'READY / DRAFT'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {r.status === 'DRAFT' ? (
                      <Button
                        size="sm"
                        onClick={() => handleValidate(r.id)}
                        disabled={validatingId === r.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {validatingId === r.id ? 'Validating...' : 'Validate'}
                      </Button>
                    ) : (
                      <Link href={`/receipts/${r.id}`}>
                        <Button size="sm" variant="outline" className="text-gray-700 hover:bg-gray-100">
                          View & Print
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {filteredReceipts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No receipts found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Draft / Ready Column */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                READY TO RECEIVE
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                {draftReceipts.length}
              </span>
            </div>

            <div className="space-y-3">
              {draftReceipts.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-4 rounded-lg border shadow-sm hover:shadow transition space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/receipts/${r.id}`}
                      className="font-mono text-sm font-bold text-blue-600 hover:underline"
                    >
                      {r.reference}
                    </Link>
                    <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                      Draft / Ready
                    </span>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{r.supplier?.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Warehouse: {r.warehouseName}</div>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {r.lines.map((l, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="truncate max-w-[180px]">{l.product?.name || l.productId}</span>
                        <span className="font-bold">x{l.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={() => handleValidate(r.id)}
                      disabled={validatingId === r.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    >
                      {validatingId === r.id ? 'Validating...' : 'Validate & Receive'}
                    </Button>
                  </div>
                </div>
              ))}
              {draftReceipts.length === 0 && (
                <div className="text-xs text-center text-gray-400 py-8">No pending receipts to receive.</div>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                RECEIVED (DONE)
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {doneReceipts.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneReceipts.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-4 rounded-lg border shadow-sm hover:shadow transition space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/receipts/${r.id}`}
                      className="font-mono text-sm font-bold text-gray-900 hover:underline"
                    >
                      {r.reference}
                    </Link>
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Done
                    </span>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{r.supplier?.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Warehouse: {r.warehouseName}</div>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {r.lines.map((l, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="truncate max-w-[180px]">{l.product?.name || l.productId}</span>
                        <span className="font-bold">x{l.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t flex justify-end">
                    <Link href={`/receipts/${r.id}`} className="w-full">
                      <Button size="sm" variant="outline" className="w-full text-xs h-8">
                        View & Print Receipt
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {doneReceipts.length === 0 && (
                <div className="text-xs text-center text-gray-400 py-8">No completed receipts yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

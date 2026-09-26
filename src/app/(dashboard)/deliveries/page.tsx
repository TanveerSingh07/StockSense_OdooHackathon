'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        throw new Error(data.error || 'Failed to validate delivery order');
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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Outbound Delivery Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage picking, packing, stock dispatch, and customer deliveries.</p>
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

          <Link href="/deliveries/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
              + New Delivery
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI mini-bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{deliveries.length}</div>
        </div>
        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Waiting for Stock</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{waitingDeliveries.length}</div>
        </div>
        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-sm">
          <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">Ready to Deliver</div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{readyDeliveries.length}</div>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Delivered (Done)</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{doneDeliveries.length}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Input
            placeholder="Search by Reference (e.g. WH/OUT/0001) or Customer / Contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 bg-white rounded-xl border">Loading delivery orders...</div>
      ) : viewMode === 'list' ? (
        /* List Table View */
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="p-4">Reference</th>
                <th className="p-4">Contact (Customer)</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4">Pick Items</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4">
                    <Link href={`/deliveries/${d.id}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
                      {d.reference}
                    </Link>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{d.customer}</td>
                  <td className="p-4 text-sm text-gray-600">{d.warehouseName}</td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{d.lines.length}</span> item(s) (
                    {d.lines.reduce((sum, l) => sum + l.quantity, 0)} units)
                  </td>
                  <td className="p-4">
                    {d.status === 'DONE' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ DONE
                      </span>
                    ) : d.hasInsufficientStock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        ⚠️ WAITING FOR STOCK
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        READY TO DELIVER
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {d.status === 'DONE' ? (
                      <Link href={`/deliveries/${d.id}`}>
                        <Button size="sm" variant="outline" className="text-gray-700 hover:bg-gray-100">
                          View & Print
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleValidate(d.id)}
                        disabled={validatingId === d.id || d.hasInsufficientStock}
                        className={
                          d.hasInsufficientStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }
                        title={d.hasInsufficientStock ? 'Cannot validate: Insufficient stock' : 'Validate and deduct stock'}
                      >
                        {validatingId === d.id ? 'Validating...' : 'Validate'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDeliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No delivery orders found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Waiting Column */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <span className="font-semibold text-sm text-amber-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                WAITING FOR STOCK
              </span>
              <span className="text-xs bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                {waitingDeliveries.length}
              </span>
            </div>

            <div className="space-y-3">
              {waitingDeliveries.map((d) => (
                <div key={d.id} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <Link href={`/deliveries/${d.id}`} className="font-mono text-sm font-bold text-red-600 hover:underline">
                      {d.reference}
                    </Link>
                    <span className="text-[11px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                      Stock Low
                    </span>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{d.customer}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Warehouse: {d.warehouseName}</div>
                  </div>

                  <div className="text-xs text-gray-600 bg-red-50/50 p-2 rounded border border-red-100">
                    {d.lines.map((l, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="truncate max-w-[150px]">{l.product?.name || l.productId}</span>
                        <span className={`font-mono ${l.isSufficient === false ? 'text-red-600 font-bold' : ''}`}>
                          req {l.quantity} (avail: {l.availableStock ?? 0})
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link href={`/deliveries/${d.id}`} className="block">
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 border-red-200 text-red-700 hover:bg-red-50">
                      Inspect Deficit
                    </Button>
                  </Link>
                </div>
              ))}
              {waitingDeliveries.length === 0 && (
                <div className="text-xs text-center text-gray-400 py-8">No orders waiting for stock.</div>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200">
              <span className="font-semibold text-sm text-blue-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                READY TO DELIVER
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                {readyDeliveries.length}
              </span>
            </div>

            <div className="space-y-3">
              {readyDeliveries.map((d) => (
                <div key={d.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow transition space-y-3">
                  <div className="flex justify-between items-start">
                    <Link href={`/deliveries/${d.id}`} className="font-mono text-sm font-bold text-blue-600 hover:underline">
                      {d.reference}
                    </Link>
                    <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      In Stock
                    </span>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{d.customer}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Warehouse: {d.warehouseName}</div>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {d.lines.map((l, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="truncate max-w-[170px]">{l.product?.name || l.productId}</span>
                        <span className="font-bold text-emerald-700">x{l.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleValidate(d.id)}
                    disabled={validatingId === d.id}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-medium"
                  >
                    {validatingId === d.id ? 'Validating...' : 'Validate & Deliver'}
                  </Button>
                </div>
              ))}
              {readyDeliveries.length === 0 && (
                <div className="text-xs text-center text-gray-400 py-8">No orders ready to deliver.</div>
              )}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <span className="font-semibold text-sm text-emerald-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                DELIVERED (DONE)
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {doneDeliveries.length}
              </span>
            </div>

            <div className="space-y-3">
              {doneDeliveries.map((d) => (
                <div key={d.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow transition space-y-3">
                  <div className="flex justify-between items-start">
                    <Link href={`/deliveries/${d.id}`} className="font-mono text-sm font-bold text-gray-900 hover:underline">
                      {d.reference}
                    </Link>
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Done
                    </span>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{d.customer}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Warehouse: {d.warehouseName}</div>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {d.lines.map((l, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="truncate max-w-[170px]">{l.product?.name || l.productId}</span>
                        <span className="font-bold">x{l.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={`/deliveries/${d.id}`} className="block">
                    <Button size="sm" variant="outline" className="w-full text-xs h-8">
                      View & Print Slip
                    </Button>
                  </Link>
                </div>
              ))}
              {doneDeliveries.length === 0 && (
                <div className="text-xs text-center text-gray-400 py-8">No completed deliveries yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

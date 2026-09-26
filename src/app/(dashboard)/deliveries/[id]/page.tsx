'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DeliveryDetail {
  id: string;
  reference: string;
  customer: string;
  warehouseId: string;
  warehouseName: string;
  status: 'DRAFT' | 'DONE';
  displayStatus: 'DRAFT' | 'WAITING' | 'READY' | 'DONE';
  hasInsufficientStock: boolean;
  lines: Array<{
    id: string;
    productId: string;
    quantity: number;
    availableStock: number;
    isSufficient: boolean;
    product?: {
      id: string;
      name: string;
      sku: string;
      unit: string;
    };
  }>;
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDelivery = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/deliveries/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDelivery(data.data);
      } else {
        setError(data.error || 'Delivery order not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDelivery();
  }, [id]);

  const handleValidate = async () => {
    try {
      setValidating(true);
      setError(null);
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to validate delivery order');
      }
      await fetchDelivery();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading delivery details...</div>;
  }

  if (error && !delivery) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <p className="font-bold">Error loading delivery order</p>
          <p className="text-sm mt-1">{error}</p>
          <Link href="/deliveries" className="mt-4 inline-block text-sm underline font-semibold">
            ← Return to Delivery Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!delivery) return null;

  const isDone = delivery.status === 'DONE';
  const hasDeficit = !isDone && delivery.hasInsufficientStock;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Bar / Navigation */}
      <div className="flex justify-between items-center print:hidden">
        <Link href="/deliveries" className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1">
          ← Back to Delivery Orders
        </Link>
        <div className="flex gap-2">
          {!isDone && (
            <Button
              onClick={handleValidate}
              disabled={validating || hasDeficit}
              className={`${
                hasDeficit
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed border'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm'
              }`}
              title={hasDeficit ? 'Cannot validate: Insufficient inventory stock' : 'Validate and deduct inventory stock'}
            >
              {validating ? 'Validating...' : 'Validate & Deliver'}
            </Button>
          )}
          {isDone && (
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-gray-300 font-medium"
            >
              🖨️ Print Delivery Note
            </Button>
          )}
          <Link href="/deliveries">
            <Button variant="ghost" className="text-gray-600">
              Close
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Document Card */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden p-8 space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Document Header & Status Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-600">Outbound Dispatch</span>
            <h1 className="text-3xl font-extrabold text-gray-900 font-mono mt-1">{delivery.reference}</h1>
          </div>

          {/* Stepper (Draft > Waiting > Ready > Done) */}
          <div className="flex items-center text-xs font-bold rounded-lg border bg-gray-50/80 p-1.5 gap-2">
            <div className={`px-2.5 py-1 rounded-md ${
              !isDone && hasDeficit
                ? 'bg-red-100 text-red-800 font-bold'
                : !isDone
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-400'
            }`}>
              {hasDeficit ? '1. Waiting for Stock' : '1. Ready'}
            </div>
            <span className="text-gray-300">→</span>
            <div className={`px-2.5 py-1 rounded-md ${isDone ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-400'}`}>
              2. Done (Shipped)
            </div>
          </div>
        </div>

        {/* Insufficient stock warning banner */}
        {hasDeficit && (
          <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold">Inventory Deficit: Insufficient On-Hand Stock</p>
              <p className="mt-1 text-xs text-red-700">
                One or more products on this pick list exceed available stock in warehouse <strong>{delivery.warehouseName}</strong>. You cannot validate and ship this order until the stock is replenished via Inbound Receipts.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-gray-50/60 p-6 rounded-xl border border-gray-100 text-sm">
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Customer / Address</div>
            <div className="font-semibold text-gray-900 mt-1">{delivery.customer}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Source Warehouse</div>
            <div className="font-semibold text-gray-900 mt-1">{delivery.warehouseName}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Responsible</div>
            <div className="font-semibold text-gray-900 mt-1">Inventory Manager</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Operational State</div>
            <div className="mt-1">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isDone
                  ? 'bg-emerald-100 text-emerald-800'
                  : hasDeficit
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isDone ? '✓ DELIVERED' : hasDeficit ? 'WAITING FOR STOCK' : 'READY TO DELIVER'}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Pick List & Reserved Quantities</h2>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4 text-center">Unit</th>
                  <th className="p-4 text-right">Available</th>
                  <th className="p-4 text-right">Demand (Qty)</th>
                  <th className="p-4 text-center">Stock Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {delivery.lines.map((line, idx) => {
                  const isLineDeficit = !isDone && line.availableStock < line.quantity;
                  return (
                    <tr
                      key={idx}
                      className={isLineDeficit ? 'bg-red-50/60 font-semibold' : 'hover:bg-gray-50/50'}
                    >
                      <td className="p-4 font-mono font-medium text-gray-700">{line.product?.sku || 'N/A'}</td>
                      <td className="p-4 font-semibold text-gray-900">{line.product?.name || line.productId}</td>
                      <td className="p-4 text-center text-gray-500">{line.product?.unit || 'Units'}</td>
                      <td className="p-4 text-right font-mono text-gray-600">
                        {isDone ? '—' : line.availableStock}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-base text-gray-900">{line.quantity}</td>
                      <td className="p-4 text-center">
                        {isDone ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Dispatched
                          </span>
                        ) : isLineDeficit ? (
                          <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                            Deficit ({line.quantity - line.availableStock} short)
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/80 font-bold border-t">
                  <td colSpan={4} className="p-4 text-right text-gray-700">Total Items to Ship:</td>
                  <td className="p-4 text-right font-mono text-base text-emerald-700">
                    {delivery.lines.reduce((sum, l) => sum + l.quantity, 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Audit / Note */}
        <div className="text-xs text-gray-500 pt-4 border-t flex justify-between items-center">
          <span>System Record ID: <span className="font-mono">{delivery.id}</span></span>
          <span>{isDone ? '✓ Stock deducted and recorded in Stock Ledger' : 'Ledger mutation will occur upon validation'}</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ReceiptDetail {
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
  lines: Array<{
    id: string;
    productId: string;
    quantity: number;
    product?: {
      id: string;
      name: string;
      sku: string;
      unit: string;
    };
  }>;
}

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/receipts/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setReceipt(data.data);
      } else {
        setError(data.error || 'Receipt not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReceipt();
  }, [id]);

  const handleValidate = async () => {
    try {
      setValidating(true);
      setError(null);
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to validate receipt');
      }
      await fetchReceipt();
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
    return <div className="p-12 text-center text-gray-500">Loading receipt details...</div>;
  }

  if (error && !receipt) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <p className="font-bold">Error loading receipt</p>
          <p className="text-sm mt-1">{error}</p>
          <Link href="/receipts" className="mt-4 inline-block text-sm underline font-semibold">
            ← Return to Receipts
          </Link>
        </div>
      </div>
    );
  }

  if (!receipt) return null;

  const isDone = receipt.status === 'DONE';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Bar / Navigation */}
      <div className="flex justify-between items-center print:hidden">
        <Link href="/receipts" className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1">
          ← Back to Inbound Receipts
        </Link>
        <div className="flex gap-2">
          {!isDone && (
            <Button
              onClick={handleValidate}
              disabled={validating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
            >
              {validating ? 'Validating...' : 'Validate & Receive Stock'}
            </Button>
          )}
          {isDone && (
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-gray-300 font-medium"
            >
              🖨️ Print Receipt
            </Button>
          )}
          <Link href="/receipts">
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
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600">Inbound Shipment</span>
            <h1 className="text-3xl font-extrabold text-gray-900 font-mono mt-1">{receipt.reference}</h1>
          </div>

          {/* Stepper (Draft > Ready > Done) */}
          <div className="flex items-center text-xs font-bold rounded-lg border bg-gray-50/80 p-1.5 gap-2">
            <div className={`px-3 py-1 rounded-md ${!isDone ? 'bg-amber-100 text-amber-800' : 'text-gray-400'}`}>
              1. Draft / Ready
            </div>
            <span className="text-gray-300">→</span>
            <div className={`px-3 py-1 rounded-md ${isDone ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-400'}`}>
              2. Done
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-gray-50/60 p-6 rounded-xl border border-gray-100 text-sm">
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Receive From (Supplier)</div>
            <div className="font-semibold text-gray-900 mt-1">{receipt.supplier?.name || receipt.supplierId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Destination Warehouse</div>
            <div className="font-semibold text-gray-900 mt-1">{receipt.warehouseName}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Responsible</div>
            <div className="font-semibold text-gray-900 mt-1">Inventory Manager</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Status</div>
            <div className="mt-1">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isDone ? 'COMPLETED (DONE)' : 'READY TO RECEIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Products Received</h2>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4 text-center">Unit</th>
                  <th className="p-4 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipt.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono font-medium text-gray-700">{line.product?.sku || 'N/A'}</td>
                    <td className="p-4 font-semibold text-gray-900">{line.product?.name || line.productId}</td>
                    <td className="p-4 text-center text-gray-500">{line.product?.unit || 'Units'}</td>
                    <td className="p-4 text-right font-mono font-bold text-base text-gray-900">{line.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/80 font-bold border-t">
                  <td colSpan={3} className="p-4 text-right text-gray-700">Total Units:</td>
                  <td className="p-4 text-right font-mono text-base text-blue-600">
                    {receipt.lines.reduce((sum, l) => sum + l.quantity, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Audit / Note */}
        <div className="text-xs text-gray-500 pt-4 border-t flex justify-between items-center">
          <span>System Record ID: <span className="font-mono">{receipt.id}</span></span>
          <span>{isDone ? '✓ Validated and recorded to Stock Ledger' : 'Draft stage — validating will increment inventory stock'}</span>
        </div>
      </div>
    </div>
  );
}

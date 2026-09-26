'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowDownLeft, Printer, Check, CheckCircle2, ShieldCheck } from 'lucide-react';

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
    return <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Loading receipt details...</div>;
  }

  if (error && !receipt) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
          <p className="font-bold text-sm">Error loading receipt</p>
          <p className="text-xs mt-1">{error}</p>
          <Link href="/receipts" className="mt-4 inline-block text-xs underline font-semibold text-red-300">
            ← Return to Receipts
          </Link>
        </div>
      </div>
    );
  }

  if (!receipt) return null;

  const isDone = receipt.status === 'DONE';

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 text-[#F0F6FC]">
      {/* Top Bar / Navigation */}
      <div className="flex justify-between items-center print:hidden">
        <Link
          href="/receipts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Inbound Receipts</span>
        </Link>
        <div className="flex gap-2">
          {!isDone && (
            <Button
              onClick={handleValidate}
              disabled={validating}
              className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              <span>{validating ? 'Validating...' : 'Validate & Receive Stock'}</span>
            </Button>
          )}
          {isDone && (
            <Button
              onClick={handlePrint}
              variant="outline"
              className="h-9 px-3.5 text-xs font-semibold bg-[#161B22] hover:bg-[#1F242C] border-white/[0.08] text-slate-200"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <span>Print Receipt</span>
            </Button>
          )}
          <Link href="/receipts">
            <Button
              variant="ghost"
              className="h-9 px-3 text-xs text-slate-400 hover:text-white hover:bg-white/[0.04]"
            >
              Close
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Document Card */}
      <div className="bg-[#161B22] border border-white/[0.08] rounded-xl shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Document Header & Status Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-sky-400">Inbound Shipment</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">{receipt.reference}</h1>
          </div>

          {/* Stepper (Draft > Ready > Done) */}
          <div className="flex items-center text-xs font-bold rounded-lg border border-white/[0.08] bg-[#0D1117] p-1.5 gap-2">
            <div className={`px-2.5 py-1 rounded-md ${!isDone ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-500'}`}>
              1. Draft / Ready
            </div>
            <span className="text-slate-600">→</span>
            <div className={`px-2.5 py-1 rounded-md ${isDone ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-500'}`}>
              2. Done
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 rounded-lg text-xs border border-red-500/20">
            {error}
          </div>
        )}

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#0D1117] p-5 rounded-xl border border-white/[0.08] text-xs">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Receive From</div>
            <div className="font-semibold text-white mt-1">{receipt.supplier?.name || receipt.supplierId}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Warehouse</div>
            <div className="font-semibold text-white mt-1">{receipt.warehouseName}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Responsible</div>
            <div className="font-semibold text-slate-300 mt-1">Inventory Manager</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Status</div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                isDone ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {isDone ? 'COMPLETED (DONE)' : 'READY TO RECEIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Products Received</h2>
          <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0D1117]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.08] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5 text-center">Unit</th>
                  <th className="p-3.5 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {receipt.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-mono text-slate-400">{line.product?.sku || 'N/A'}</td>
                    <td className="p-3.5 font-medium text-white">{line.product?.name || line.productId}</td>
                    <td className="p-3.5 text-center text-slate-400">{line.product?.unit || 'Units'}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400 text-sm">{line.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/[0.02] font-bold border-t border-white/[0.08]">
                  <td colSpan={3} className="p-3.5 text-right text-slate-300">Total Units:</td>
                  <td className="p-3.5 text-right font-mono text-emerald-400 text-sm">
                    {receipt.lines.reduce((sum, l) => sum + l.quantity, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Audit / Note */}
        <div className="text-[11px] text-slate-400 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span>System Record ID: <span className="font-mono text-slate-300">{receipt.id}</span></span>
          <span className="text-emerald-400 font-medium">
            {isDone ? '✓ Validated and recorded to Stock Ledger' : 'Draft stage — validating will increment inventory stock'}
          </span>
        </div>
      </div>
    </div>
  );
}

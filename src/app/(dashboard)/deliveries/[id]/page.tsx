'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUpRight, Printer, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
    return <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Loading delivery details...</div>;
  }

  if (error && !delivery) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
          <p className="font-bold text-sm">Error loading delivery order</p>
          <p className="text-xs mt-1">{error}</p>
          <Link href="/deliveries" className="mt-4 inline-block text-xs underline font-semibold text-red-300">
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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 text-[#F0F6FC]">
      {/* Top Bar / Navigation */}
      <div className="flex justify-between items-center print:hidden">
        <Link
          href="/deliveries"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Delivery Orders</span>
        </Link>
        <div className="flex gap-2">
          {!isDone && (
            <Button
              onClick={handleValidate}
              disabled={validating || hasDeficit}
              className={`h-9 px-4 text-xs font-semibold transition-all ${
                hasDeficit
                  ? 'bg-slate-800 text-slate-500 border border-white/[0.08] cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 cursor-pointer'
              }`}
              title={hasDeficit ? 'Cannot validate: Insufficient inventory stock' : 'Validate and deduct inventory stock'}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              <span>{validating ? 'Validating...' : 'Validate & Deliver'}</span>
            </Button>
          )}
          {isDone && (
            <Button
              onClick={handlePrint}
              variant="outline"
              className="h-9 px-3.5 text-xs font-semibold bg-[#161B22] hover:bg-[#1F242C] border-white/[0.08] text-slate-200"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <span>Print Delivery Note</span>
            </Button>
          )}
          <Link href="/deliveries">
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
            <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">Outbound Dispatch</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">{delivery.reference}</h1>
          </div>

          {/* Stepper (Draft > Waiting > Ready > Done) */}
          <div className="flex items-center text-xs font-bold rounded-lg border border-white/[0.08] bg-[#0D1117] p-1.5 gap-2">
            <div
              className={`px-2.5 py-1 rounded-md ${
                !isDone && hasDeficit
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : !isDone
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-500'
              }`}
            >
              {hasDeficit ? '1. Waiting for Stock' : '1. Ready'}
            </div>
            <span className="text-slate-600">→</span>
            <div
              className={`px-2.5 py-1 rounded-md ${
                isDone ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-slate-500'
              }`}
            >
              2. Done (Shipped)
            </div>
          </div>
        </div>

        {/* Insufficient stock warning banner */}
        {hasDeficit && (
          <div className="p-4 bg-red-500/10 text-red-300 rounded-xl border border-red-500/20 text-xs flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">Inventory Deficit: Insufficient On-Hand Stock</p>
              <p className="mt-1 text-slate-300">
                One or more products on this pick list exceed available stock in warehouse <strong>{delivery.warehouseName}</strong>. You cannot validate and ship this order until stock is replenished via Inbound Receipts.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 rounded-lg text-xs border border-red-500/20">
            {error}
          </div>
        )}

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#0D1117] p-5 rounded-xl border border-white/[0.08] text-xs">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Customer / Address</div>
            <div className="font-semibold text-white mt-1">{delivery.customer}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Warehouse</div>
            <div className="font-semibold text-white mt-1">{delivery.warehouseName}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Responsible</div>
            <div className="font-semibold text-slate-300 mt-1">Inventory Manager</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Operational State</div>
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                  isDone
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : hasDeficit
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                }`}
              >
                {isDone ? '✓ DELIVERED' : hasDeficit ? 'WAITING FOR STOCK' : 'READY TO DELIVER'}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Pick List & Reserved Quantities</h2>
          <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#0D1117]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.08] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5 text-center">Unit</th>
                  <th className="p-3.5 text-right">Available</th>
                  <th className="p-3.5 text-right">Demand</th>
                  <th className="p-3.5 text-center">Stock Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {delivery.lines.map((line, idx) => {
                  const isLineDeficit = !isDone && line.availableStock < line.quantity;
                  return (
                    <tr
                      key={idx}
                      className={isLineDeficit ? 'bg-red-500/[0.06] hover:bg-red-500/[0.1]' : 'hover:bg-white/[0.02]'}
                    >
                      <td className="p-3.5 font-mono text-slate-400">{line.product?.sku || 'N/A'}</td>
                      <td className="p-3.5 font-medium text-white">{line.product?.name || line.productId}</td>
                      <td className="p-3.5 text-center text-slate-400">{line.product?.unit || 'Units'}</td>
                      <td className="p-3.5 text-right font-mono text-slate-300">
                        {isDone ? '—' : line.availableStock}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white text-sm">{line.quantity}</td>
                      <td className="p-3.5 text-center">
                        {isDone ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Dispatched
                          </span>
                        ) : isLineDeficit ? (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            Deficit ({line.quantity - line.availableStock} short)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-white/[0.02] font-bold border-t border-white/[0.08]">
                  <td colSpan={4} className="p-3.5 text-right text-slate-300">Total Items to Ship:</td>
                  <td className="p-3.5 text-right font-mono text-emerald-400 text-sm">
                    {delivery.lines.reduce((sum, l) => sum + l.quantity, 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Audit / Note */}
        <div className="text-[11px] text-slate-400 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span>System Record ID: <span className="font-mono text-slate-300">{delivery.id}</span></span>
          <span className="text-emerald-400 font-medium">
            {isDone ? '✓ Stock deducted and recorded in Stock Ledger' : 'Ledger mutation will occur upon validation'}
          </span>
        </div>
      </div>
    </div>
  );
}

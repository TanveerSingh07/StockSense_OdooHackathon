'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
  Package, 
  Warehouse as WarehouseIcon, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Plus, 
  Minus, 
  Clock, 
  Copy, 
  Check, 
  HelpCircle,
  TrendingUp,
  Tag,
  Boxes,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/app/products/page';

interface ProductDetailSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onStockAdjusted?: (productId: string, warehouseId: string, newQty: number) => void;
  warehouses: Array<{ id: string; name: string }>;
}

export function ProductDetailSheet({
  product,
  isOpen,
  onClose,
  onStockAdjusted,
  warehouses,
}: ProductDetailSheetProps) {
  const [copied, setCopied] = useState(false);
  const [adjustingWarehouseId, setAdjustingWarehouseId] = useState<string | null>(null);
  const [recentMoves, setRecentMoves] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch recent stock movements for this product
  useEffect(() => {
    if (isOpen && product) {
      setLoadingHistory(true);
      fetch(`/api/history?productId=${product.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setRecentMoves(data.data.slice(0, 5));
          } else {
            setRecentMoves([]);
          }
        })
        .catch(() => setRecentMoves([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleCopySku = () => {
    navigator.clipboard.writeText(product.sku);
    setCopied(true);
    toast.success('SKU copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickDelta = async (warehouseId: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    if (newQty === currentQty && delta < 0) return;

    setAdjustingWarehouseId(warehouseId);
    const prevQty = currentQty;

    // Optimistic UI update
    if (onStockAdjusted) {
      onStockAdjusted(product.id, warehouseId, newQty);
    }

    try {
      const res = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          warehouseId,
          change: delta,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to adjust stock');
      }

      toast.success(`Stock ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)} ${product.unit}`, {
        action: {
          label: 'Undo',
          onClick: () => handleQuickDelta(warehouseId, newQty, -delta),
        },
      });
    } catch (err: any) {
      // Rollback optimistic update
      if (onStockAdjusted) {
        onStockAdjusted(product.id, warehouseId, prevQty);
      }
      toast.error(err.message || 'Failed to update stock quantity');
    } finally {
      setAdjustingWarehouseId(null);
    }
  };

  const isOutOfStock = product.totalQuantity === 0;
  const isLowStock = product.totalQuantity <= product.reorderPoint;
  const ratio = product.reorderPoint > 0 ? Math.min(100, Math.round((product.totalQuantity / product.reorderPoint) * 100)) : 100;

  // Format relative time helper
  const getRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden select-none">
      {/* Flat Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-[#0F172A] text-zinc-100 border-l border-white/[0.08] flex flex-col justify-between animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-5 border-b border-white/[0.08] bg-[#0F172A] flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
                <Package className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100 leading-snug">
                  {product.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-zinc-400 flex items-center gap-1.5">
                    <span>{product.sku}</span>
                    <button
                      onClick={handleCopySku}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      title="Copy SKU"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs text-zinc-400">
                    {product.category?.name || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
            
            {/* Stock Metric Card */}
            <div className="p-4 rounded-lg bg-[#1E293B] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Left: Numbers */}
              <div className="sm:col-span-2 space-y-1">
                <div className="text-sm font-normal text-zinc-400">
                  Stock on hand
                </div>
                <div className="text-3xl font-semibold text-white font-mono tabular-nums flex items-baseline gap-1.5">
                  <span>{product.totalQuantity}</span>
                  <span className="text-xs font-normal text-zinc-400 font-sans">{product.unit}</span>
                </div>
                <div className="text-xs text-zinc-400 pt-0.5">
                  Reorder threshold: <span className="text-zinc-200 font-mono">{product.reorderPoint} {product.unit}</span>
                </div>
              </div>

              {/* Right: Neutral Track Radial Ring */}
              <div className="flex flex-col items-center justify-center p-1">
                <div className="relative h-14 w-14 flex items-center justify-center">
                  <svg className="h-14 w-14 -rotate-90 transform" viewBox="0 0 36 36">
                    <path
                      className="text-zinc-700"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${
                        isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-emerald-500'
                      }`}
                      strokeDasharray={`${ratio}, 100`}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono font-medium text-xs text-zinc-200">
                    {ratio}%
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 mt-1">
                  {isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock' : 'Optimal'}
                </span>
              </div>
            </div>

            {/* Warehouse Stock Breakdown with Stepper */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-zinc-300">
                  Stock by warehouse
                </h3>
                <span className="text-[11px] text-zinc-500">Quick adjust</span>
              </div>

              <div className="space-y-1.5">
                {warehouses.map((wh) => {
                  const level = (product.levels || []).find((l) => l.warehouseId === wh.id);
                  const qty = level ? level.quantity : 0;
                  const isAdjusting = adjustingWarehouseId === wh.id;

                  return (
                    <div
                      key={wh.id}
                      className="p-3 bg-[#1E293B] border border-white/[0.08] rounded-lg flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium text-zinc-200 text-xs">{wh.name}</div>
                        <div className="text-[11px] text-zinc-500">Location</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickDelta(wh.id, qty, -1)}
                          disabled={qty <= 0 || isAdjusting}
                          className="h-7 w-7 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          title="Decrease 1"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <div className="w-10 text-center font-mono font-semibold text-xs text-white">
                          {qty}
                        </div>

                        <button
                          onClick={() => handleQuickDelta(wh.id, qty, 1)}
                          disabled={isAdjusting}
                          className="h-7 w-7 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          title="Increase 1"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {warehouses.length === 0 && (
                  <div className="p-4 text-center text-zinc-400 bg-[#1E293B] rounded-lg border border-white/[0.08]">
                    No warehouses configured.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-300">
                Quick actions
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/receipts/new"
                  className="p-2.5 rounded-lg bg-[#1E293B] hover:bg-[#283548] border border-white/[0.08] text-zinc-200 hover:text-white transition-colors flex flex-col items-center justify-center text-center gap-1.5"
                >
                  <ArrowDownLeft className="h-4 w-4 text-zinc-400" />
                  <span className="text-[11px] font-medium">Receive stock</span>
                </Link>

                <Link
                  href="/deliveries/new"
                  className="p-2.5 rounded-lg bg-[#1E293B] hover:bg-[#283548] border border-white/[0.08] text-zinc-200 hover:text-white transition-colors flex flex-col items-center justify-center text-center gap-1.5"
                >
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                  <span className="text-[11px] font-medium">Create delivery</span>
                </Link>

                <Link
                  href="/adjustments/new"
                  className="p-2.5 rounded-lg bg-[#1E293B] hover:bg-[#283548] border border-white/[0.08] text-zinc-200 hover:text-white transition-colors flex flex-col items-center justify-center text-center gap-1.5"
                >
                  <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
                  <span className="text-[11px] font-medium">Adjust stock</span>
                </Link>
              </div>
            </div>

            {/* Recent Movements */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-zinc-300">
                Recent movements
              </h3>

              {loadingHistory ? (
                <div className="p-4 text-center text-zinc-500">Loading movements...</div>
              ) : recentMoves.length === 0 ? (
                <div className="p-4 bg-[#1E293B] border border-white/[0.08] rounded-lg text-zinc-400 text-center text-[11px]">
                  No recent movements recorded.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-lg bg-[#1E293B] overflow-hidden">
                  {recentMoves.map((m) => {
                    const isIn = m.change > 0;
                    const cleanRef = m.refId
                      ? m.refId.length > 12 && m.refId.startsWith('c')
                        ? `…${m.refId.slice(-6)}`
                        : m.refId
                      : 'MANUAL';

                    return (
                      <div key={m.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors">
                        <div>
                          <div className="font-medium text-zinc-200">
                            {m.reason === 'RECEIPT'
                              ? 'Inbound receipt'
                              : m.reason === 'DELIVERY'
                              ? 'Outbound delivery'
                              : m.reason === 'ADJUSTMENT'
                              ? 'Stock adjustment'
                              : m.reason}
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5 font-mono">
                            <span>{getRelativeTime(m.createdAt)}</span>
                            <span>•</span>
                            <span>{cleanRef}</span>
                          </div>
                        </div>

                        <span
                          className={`font-mono font-medium text-xs px-2 py-0.5 rounded ${
                            isIn
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {isIn ? `+${m.change}` : m.change} {product.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#0F172A] flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

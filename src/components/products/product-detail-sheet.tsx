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
  Boxes
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-[#0E131A] text-[#F0F6FC] shadow-2xl border-l border-white/[0.08] flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#121720] flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                  {product.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-slate-300 bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08] flex items-center gap-1">
                    <span>{product.sku}</span>
                    <button
                      onClick={handleCopySku}
                      className="hover:text-emerald-400 transition-colors cursor-pointer"
                      title="Copy SKU"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </span>
                  <span className="text-xs text-slate-400">
                    Category: <strong className="text-slate-200">{product.category?.name || 'General'}</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
            {/* Stock Summary Banner */}
            <div className="p-4 rounded-xl bg-[#151B24] border border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[11px] text-slate-400">Total On-Hand</div>
                <div className="text-xl font-bold text-white mt-0.5">
                  {product.totalQuantity} <span className="text-xs font-normal text-slate-400">{product.unit}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Min Safety Reorder</div>
                <div className="text-xl font-bold text-slate-200 mt-0.5">
                  {product.reorderPoint} <span className="text-xs font-normal text-slate-400">{product.unit}</span>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-[11px] text-slate-400">Health State</div>
                <div className="mt-1">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Low Stock Alert
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Optimal Level
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Warehouse Stock Breakdown with Stepper */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <WarehouseIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Stock by Warehouse Location</span>
                </h3>
                <span className="text-[11px] text-slate-400">Quick adjust (+/−)</span>
              </div>

              <div className="space-y-2">
                {warehouses.map((wh) => {
                  const level = (product.levels || []).find((l) => l.warehouseId === wh.id);
                  const qty = level ? level.quantity : 0;
                  const isAdjusting = adjustingWarehouseId === wh.id;

                  return (
                    <div
                      key={wh.id}
                      className="p-3 bg-[#151B24] border border-white/[0.08] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium text-slate-100">{wh.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {wh.id}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickDelta(wh.id, qty, -1)}
                          disabled={qty <= 0 || isAdjusting}
                          className="h-7 w-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                          title="Decrease 1 unit"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <div className="w-12 text-center font-mono font-bold text-sm text-white">
                          {qty}
                        </div>

                        <button
                          onClick={() => handleQuickDelta(wh.id, qty, 1)}
                          disabled={isAdjusting}
                          className="h-7 w-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:text-emerald-300 disabled:opacity-30 transition-colors cursor-pointer"
                          title="Increase 1 unit"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {warehouses.length === 0 && (
                  <div className="p-4 text-center text-slate-400 bg-[#151B24] rounded-xl border border-white/[0.06]">
                    No warehouses configured in settings.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Operations Submenu */}
            <div className="space-y-2">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
                Quick Warehouse Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Link
                  href="/receipts/new"
                  className="p-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 text-sky-300 hover:text-sky-200 transition-colors flex flex-col items-center justify-center text-center gap-1"
                >
                  <ArrowDownLeft className="h-4 w-4 text-sky-400" />
                  <span className="font-medium text-[11px]">Receive Stock</span>
                </Link>

                <Link
                  href="/deliveries/new"
                  className="p-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 hover:text-emerald-200 transition-colors flex flex-col items-center justify-center text-center gap-1"
                >
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium text-[11px]">Create Delivery</span>
                </Link>

                <Link
                  href="/adjustments/new"
                  className="p-2.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 text-purple-300 hover:text-purple-200 transition-colors flex flex-col items-center justify-center text-center gap-1"
                >
                  <SlidersHorizontal className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-[11px]">Adjust Count</span>
                </Link>
              </div>
            </div>

            {/* Recent Movement Mini Timeline */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Recent Stock Movements</span>
              </h3>

              {loadingHistory ? (
                <div className="p-4 text-center text-slate-400 animate-pulse">Loading movements...</div>
              ) : recentMoves.length === 0 ? (
                <div className="p-4 bg-[#151B24] border border-white/[0.06] rounded-xl text-slate-400 text-center text-[11px]">
                  No movement history recorded yet for this product.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentMoves.map((m) => {
                    const isIn = m.change > 0;
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 bg-[#151B24] border border-white/[0.06] rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-slate-200">{m.reason}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(m.createdAt).toLocaleDateString()} • {m.refId}
                          </div>
                        </div>
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            isIn
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
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
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#121720] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              ID: <span className="font-mono text-slate-300">{product.id}</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white rounded-lg transition-colors cursor-pointer"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

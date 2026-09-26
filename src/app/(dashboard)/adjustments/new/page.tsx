'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WarehouseOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  levels?: Array<{
    warehouseId: string;
    quantity: number;
  }>;
}

export default function NewAdjustmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [countedQty, setCountedQty] = useState<number | ''>('');
  const [reasonNote, setReasonNote] = useState('Annual Physical Count');

  useEffect(() => {
    async function loadOptions() {
      try {
        setFetching(true);
        const [wRes, pRes] = await Promise.all([
          fetch('/api/warehouses'),
          fetch('/api/products'),
        ]);

        const [wData, pData] = await Promise.all([
          wRes.json().catch(() => ({})),
          pRes.json().catch(() => ({})),
        ]);

        if (wData.success && wData.data?.length) {
          setWarehouses(wData.data);
          setWarehouseId(wData.data[0].id);
        }

        if (pData.success && pData.data?.length) {
          setProducts(pData.data);
          if (pData.data[0]) {
            setProductId(pData.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load adjustment options:', err);
      } finally {
        setFetching(false);
      }
    }

    loadOptions();
  }, []);

  // Compute System Recorded Stock
  const selectedProduct = products.find((p) => p.id === productId);
  const systemQty = (() => {
    if (!selectedProduct || !selectedProduct.levels) return 0;
    const lvl = selectedProduct.levels.find((l) => l.warehouseId === warehouseId);
    return lvl ? lvl.quantity : 0;
  })();

  // When product or warehouse changes, set countedQty default to systemQty
  useEffect(() => {
    setCountedQty(systemQty);
  }, [productId, warehouseId, systemQty]);

  const numericCounted = countedQty === '' ? 0 : Number(countedQty);
  const diff = numericCounted - systemQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !warehouseId) {
      alert('Please select both a product and a warehouse.');
      return;
    }

    if (diff === 0) {
      alert('Counted quantity equals system quantity (difference is 0). No adjustment needed.');
      return;
    }

    if (numericCounted < 0) {
      alert('Counted physical stock cannot be negative.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          warehouseId,
          change: diff,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit stock adjustment');
      }

      router.push('/history');
      router.refresh();
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 text-[#F0F6FC]">
      {/* Top Bar */}
      <div>
        <Link href="/" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">Physical Stock Adjustment</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Perform a physical inventory audit adjustment to reconcile counted vs recorded stock. Auto-logs diffs to the ledger.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#161B22] p-6 sm:p-8 rounded-xl border border-white/[0.08] shadow-sm">
        {/* Warehouse & Product Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-slate-300">Warehouse Location *</Label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#161B22] text-white">
                  {w.name}
                </option>
              ))}
              {warehouses.length === 0 && <option value="">No warehouses found</option>}
            </select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium text-slate-300">Product to Adjust *</Label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#161B22] text-white">
                  [{p.sku}] {p.name}
                </option>
              ))}
              {products.length === 0 && <option value="">No products found</option>}
            </select>
          </div>
        </div>

        {/* Counted vs System Diff Calculation Card */}
        <div className="bg-[#0D1117] p-5 rounded-xl border border-white/[0.08] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Inventory Reconciliation Metrics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* System Quantity */}
            <div className="bg-[#161B22] p-4 rounded-lg border border-white/[0.06]">
              <div className="text-xs text-slate-400 font-medium">System Recorded (On Hand)</div>
              <div className="text-2xl font-mono font-bold text-white mt-1">
                {systemQty} <span className="text-xs font-normal text-slate-500">{selectedProduct?.unit || 'units'}</span>
              </div>
            </div>

            {/* Counted Quantity */}
            <div className="bg-[#161B22] p-4 rounded-lg border border-emerald-500/30 ring-1 ring-emerald-500/20">
              <Label className="text-xs text-emerald-400 font-bold block mb-1">
                Counted (Physical Stock) *
              </Label>
              <Input
                type="number"
                min="0"
                value={countedQty}
                onChange={(e) => setCountedQty(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="font-mono text-xl font-bold text-emerald-300 h-9 bg-[#0D1117] border-white/[0.1]"
              />
            </div>

            {/* Computed Difference */}
            <div className={`p-4 rounded-lg border ${
              diff > 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : diff < 0
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-[#161B22] border-white/[0.06] text-slate-400'
            }`}>
              <div className="text-xs font-medium">Computed Adjustment Diff</div>
              <div className="text-2xl font-mono font-bold mt-1">
                {diff > 0 ? `+${diff}` : diff}
              </div>
              <div className="text-[11px] mt-0.5 font-medium opacity-80">
                {diff > 0 ? 'Surplus (+ Stock)' : diff < 0 ? 'Deficit (− Stock)' : 'Balanced (No Diff)'}
              </div>
            </div>
          </div>
        </div>

        {/* Reason / Notes */}
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-slate-300">Reason for Adjustment</Label>
          <select
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            className="w-full h-10 px-3 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          >
            <option value="Annual Physical Count" className="bg-[#161B22] text-white">Physical Inventory Count Reconciliation</option>
            <option value="Damaged Goods" className="bg-[#161B22] text-white">Damaged / Expired Inventory Write-off</option>
            <option value="Inventory Found" className="bg-[#161B22] text-white">Unrecorded Surplus Found</option>
            <option value="Packaging Discrepancy" className="bg-[#161B22] text-white">Packaging Discrepancy</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-5 border-t border-white/[0.08]">
          <Link href="/">
            <Button type="button" variant="outline" className="border-white/[0.1] text-slate-300 hover:bg-white/[0.05]">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || fetching || diff === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 px-4 rounded-lg shadow-sm"
          >
            {loading ? 'Submitting...' : 'Apply Stock Adjustment'}
          </Button>
        </div>
      </form>
    </div>
  );
}

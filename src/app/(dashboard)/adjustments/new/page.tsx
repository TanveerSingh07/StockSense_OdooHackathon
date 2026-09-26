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
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 text-[#dae2fd]">
      {/* Top Bar */}
      <div>
        <Link href="/" className="text-xs font-semibold text-[#ffc174] hover:text-[#ffd49d]">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dae2fd] mt-1">Physical Stock Adjustment</h1>
        <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
          Perform a physical inventory audit adjustment to reconcile counted vs recorded stock. Auto-logs diffs to the ledger.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#131b2e] p-6 sm:p-8 rounded-xl border border-[#2d3449]/70 shadow-sm">
        {/* Warehouse & Product Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-[#b4c6d4]">Warehouse Location *</Label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-[#0b1326] border border-[#2d3449]/70 rounded-lg text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#ffc174]/20 focus:border-[#ffc174] transition-colors"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#131b2e] text-[#dae2fd]">
                  {w.name}
                </option>
              ))}
              {warehouses.length === 0 && <option value="">No warehouses found</option>}
            </select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium text-[#b4c6d4]">Product to Adjust *</Label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-[#0b1326] border border-[#2d3449]/70 rounded-lg text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#ffc174]/20 focus:border-[#ffc174] transition-colors"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#131b2e] text-[#dae2fd]">
                  [{p.sku}] {p.name}
                </option>
              ))}
              {products.length === 0 && <option value="">No products found</option>}
            </select>
          </div>
        </div>

        {/* Counted vs System Diff Calculation Card */}
        <div className="bg-[#0b1326] p-5 rounded-xl border border-[#2d3449]/70 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
            Inventory Reconciliation Metrics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* System Quantity */}
            <div className="bg-[#131b2e] p-4 rounded-lg border border-[#2d3449]/50">
              <div className="text-xs text-[#94a3b8] font-medium">System Recorded (On Hand)</div>
              <div className="text-2xl font-mono font-bold text-[#dae2fd] mt-1">
                {systemQty} <span className="text-xs font-normal text-[#94a3b8]">{selectedProduct?.unit || 'units'}</span>
              </div>
            </div>

            {/* Counted Quantity */}
            <div className="bg-[#131b2e] p-4 rounded-lg border border-[#ffc174]/30 ring-1 ring-[#ffc174]/20">
              <Label className="text-xs text-[#ffc174] font-bold block mb-1">
                Counted (Physical Stock) *
              </Label>
              <Input
                type="number"
                min="0"
                value={countedQty}
                onChange={(e) => setCountedQty(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="font-mono text-xl font-bold text-[#ffd49d] h-9 bg-[#0b1326] border-[#2d3449]/70"
              />
            </div>

            {/* Computed Difference */}
            <div className={`p-4 rounded-lg border ${
              diff > 0
                ? 'bg-[#ffc174]/10 border-[#ffc174]/30 text-[#ffd49d]'
                : diff < 0
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-[#131b2e] border-[#2d3449]/50 text-[#94a3b8]'
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
          <Label className="mb-1.5 block text-xs font-medium text-[#b4c6d4]">Reason for Adjustment</Label>
          <select
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            className="w-full h-10 px-3 text-xs bg-[#0b1326] border border-[#2d3449]/70 rounded-lg text-[#dae2fd] focus:outline-none focus:ring-2 focus:ring-[#ffc174]/20 focus:border-[#ffc174] transition-colors"
          >
            <option value="Annual Physical Count" className="bg-[#131b2e] text-[#dae2fd]">Physical Inventory Count Reconciliation</option>
            <option value="Damaged Goods" className="bg-[#131b2e] text-[#dae2fd]">Damaged / Expired Inventory Write-off</option>
            <option value="Inventory Found" className="bg-[#131b2e] text-[#dae2fd]">Unrecorded Surplus Found</option>
            <option value="Packaging Discrepancy" className="bg-[#131b2e] text-[#dae2fd]">Packaging Discrepancy</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-5 border-t border-[#2d3449]/70">
          <Link href="/">
            <Button type="button" variant="outline" className="border-[#2d3449]/70 text-[#b4c6d4] hover:bg-[#222a3d]">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || fetching || diff === 0}
            className="bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] font-medium text-xs h-9 px-4 rounded-lg shadow-sm"
          >
            {loading ? 'Submitting...' : 'Apply Stock Adjustment'}
          </Button>
        </div>
      </form>
    </div>
  );
}

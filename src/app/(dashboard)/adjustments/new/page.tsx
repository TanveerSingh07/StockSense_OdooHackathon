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
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div>
        <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-2">Physical Stock Adjustment</h1>
        <p className="text-sm text-gray-500 mt-1">
          Reconcile physical warehouse counts against system recorded stock levels. Auto-logs diffs to the ledger.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border shadow-sm space-y-8">
        {/* Warehouse & Product Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block font-semibold text-gray-700">Warehouse Location *</Label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full h-10 px-3 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
              {warehouses.length === 0 && <option value="">No warehouses found</option>}
            </select>
          </div>

          <div>
            <Label className="mb-2 block font-semibold text-gray-700">Product to Adjust *</Label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-10 px-3 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
              {products.length === 0 && <option value="">No products found</option>}
            </select>
          </div>
        </div>

        {/* Counted vs System Diff Calculation Card */}
        <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-200 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Inventory Reconciliation Metrics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* System Quantity */}
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <div className="text-xs text-gray-500 font-medium">System Recorded (On Hand)</div>
              <div className="text-3xl font-mono font-bold text-gray-900 mt-1">
                {systemQty} <span className="text-xs font-normal text-gray-400">{selectedProduct?.unit || 'units'}</span>
              </div>
            </div>

            {/* Counted Quantity */}
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm ring-2 ring-blue-100">
              <Label className="text-xs text-blue-700 font-bold block mb-1">
                Counted (Physical Stock) *
              </Label>
              <Input
                type="number"
                min="0"
                value={countedQty}
                onChange={(e) => setCountedQty(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="font-mono text-2xl font-bold text-blue-900 h-10 bg-white"
              />
            </div>

            {/* Computed Difference */}
            <div className={`p-4 rounded-xl border shadow-sm ${
              diff > 0
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : diff < 0
                ? 'bg-red-50/80 border-red-200 text-red-900'
                : 'bg-white border-gray-200 text-gray-600'
            }`}>
              <div className="text-xs font-medium">Computed Adjustment Diff</div>
              <div className="text-3xl font-mono font-bold mt-1">
                {diff > 0 ? `+${diff}` : diff}
              </div>
              <div className="text-[11px] mt-0.5 font-medium">
                {diff > 0 ? 'Surplus (+ Stock)' : diff < 0 ? 'Deficit (− Stock)' : 'Balanced (No Diff)'}
              </div>
            </div>
          </div>
        </div>

        {/* Reason / Notes */}
        <div>
          <Label className="mb-2 block font-semibold text-gray-700">Reason for Adjustment</Label>
          <select
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            className="w-full h-10 px-3 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          >
            <option value="Annual Physical Count">Physical Inventory Count Reconciliation</option>
            <option value="Damaged Goods">Damaged / Expired Inventory Write-off</option>
            <option value="Inventory Found">Unrecorded Surplus Found</option>
            <option value="Packaging Discrepancy">Packaging Discrepancy</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Link href="/">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || fetching || diff === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            {loading ? 'Submitting...' : 'Apply Stock Adjustment'}
          </Button>
        </div>
      </form>
    </div>
  );
}

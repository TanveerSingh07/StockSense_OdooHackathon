'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { SlidersHorizontal, Check } from 'lucide-react';

export default function NewAdjustmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [change, setChange] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/adjustments', {
        method: 'POST',
        body: JSON.stringify({ productId, warehouseId, change: Number(change) }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || await res.text());
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6 text-[#F0F6FC]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Create Stock Adjustment</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Perform a physical inventory audit adjustment to reconcile counted vs recorded stock.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-[#161B22] p-6 rounded-xl border border-white/[0.08] shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-slate-300">Product Identifier *</Label>
            <input 
              value={productId} 
              onChange={e => setProductId(e.target.value)} 
              required 
              placeholder="e.g. product ID or SKU" 
              className="w-full px-3 py-2 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-slate-300">Warehouse Identifier *</Label>
            <input 
              value={warehouseId} 
              onChange={e => setWarehouseId(e.target.value)} 
              required 
              placeholder="e.g. warehouse ID" 
              className="w-full px-3 py-2 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-xs font-medium text-slate-300">Quantity Delta Change (+ or -) *</Label>
          <input 
            type="number"
            value={change} 
            onChange={e => setChange(Number(e.target.value))} 
            required 
            placeholder="e.g. -5 to reduce, 10 to add" 
            className="w-full px-3 py-2 text-xs font-mono bg-[#0D1117] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">
            Use a negative number to reduce stock (e.g. shrinkage/damage) or positive number to increment inventory.
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading || change === 0}
          className="w-full py-2.5 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          <span>{loading ? 'Adjusting...' : 'Save Stock Adjustment'}</span>
        </button>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Stock Adjustment</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Product ID</Label>
            <Input 
              value={productId} 
              onChange={e => setProductId(e.target.value)} 
              required 
              placeholder="e.g. product_apple_1" 
            />
          </div>
          <div>
            <Label className="mb-2 block">Warehouse ID</Label>
            <Input 
              value={warehouseId} 
              onChange={e => setWarehouseId(e.target.value)} 
              required 
              placeholder="e.g. cmui2htg00000y93mkgtqkao0" 
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Quantity Change (+ or -)</Label>
          <Input 
            type="number"
            value={change} 
            onChange={e => setChange(Number(e.target.value))} 
            required 
            placeholder="e.g. -5 to reduce, 10 to add" 
          />
          <p className="text-xs text-gray-500 mt-2">Use a negative number to reduce stock (e.g. due to damage), or a positive number to increase it.</p>
        </div>

        <Button type="submit" className="w-full mt-6" disabled={loading || change === 0}>
          {loading ? 'Adjusting...' : 'Save Adjustment'}
        </Button>
      </form>
    </div>
  );
}

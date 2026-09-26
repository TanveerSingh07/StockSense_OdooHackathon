'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewDeliveryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [customer, setCustomer] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lines, setLines] = useState([{ productId: '', quantity: 1 }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        body: JSON.stringify({ customer, warehouseId, lines }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || await res.text());
      }
      router.push('/deliveries');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Delivery Order</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Customer Name</Label>
            <Input 
              value={customer} 
              onChange={e => setCustomer(e.target.value)} 
              required 
              placeholder="e.g. Acme Corp" 
            />
          </div>
          <div>
            <Label className="mb-2 block">Warehouse ID</Label>
            <Input 
              value={warehouseId} 
              onChange={e => setWarehouseId(e.target.value)} 
              required 
              placeholder="e.g. w1" 
            />
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <Label>Pick Lines</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setLines([...lines, { productId: '', quantity: 1 }])}
            >
              + Add Item
            </Button>
          </div>
          
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <div className="flex-1">
                  <Input 
                    placeholder="Product ID" 
                    value={line.productId} 
                    onChange={e => {
                      const newLines = [...lines];
                      newLines[idx].productId = e.target.value;
                      setLines(newLines);
                    }} 
                    required 
                  />
                </div>
                <div className="w-24">
                  <Input 
                    type="number" 
                    min="1" 
                    value={line.quantity} 
                    onChange={e => {
                      const newLines = [...lines];
                      newLines[idx].quantity = Number(e.target.value);
                      setLines(newLines);
                    }} 
                    required 
                  />
                </div>
                {lines.length > 1 && (
                  <Button 
                    type="button" 
                    onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                  >
                    X
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full mt-6" disabled={loading}>
          {loading ? 'Saving...' : 'Create Draft Order'}
        </Button>
      </form>
    </div>
  );
}

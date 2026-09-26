'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface WarehouseOption {
  id: string;
  name: string;
}

export default function NewDeliveryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [customer, setCustomer] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState([{ productId: '', quantity: 1 }]);

  useEffect(() => {
    async function loadOptions() {
      try {
        setFetchingOptions(true);
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
            setLines([{ productId: pData.data[0].id, quantity: 1 }]);
          }
        }
      } catch (err) {
        console.error('Failed to load delivery form options:', err);
      } finally {
        setFetchingOptions(false);
      }
    }

    loadOptions();
  }, []);

  const getAvailableStock = (prodId: string, whId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod || !prod.levels) return 0;
    const lvl = prod.levels.find(l => l.warehouseId === whId);
    return lvl ? lvl.quantity : 0;
  };

  const handleAddLine = () => {
    const defaultProdId = products[0]?.id || '';
    setLines([...lines, { productId: defaultProdId, quantity: 1 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const hasAnyDeficit = lines.some(l => {
    const avail = getAvailableStock(l.productId, warehouseId);
    return l.quantity > avail;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) {
      alert('Please enter a customer or delivery contact.');
      return;
    }
    if (!warehouseId) {
      alert('Please select a dispatch warehouse.');
      return;
    }

    const validLines = lines.filter(l => l.productId && l.quantity > 0);
    if (!validLines.length) {
      alert('Please add at least one line item with quantity > 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer.trim(),
          warehouseId,
          lines: validLines,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create delivery order');
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
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/deliveries" className="text-sm font-semibold text-gray-500 hover:text-gray-800">
            ← Back to Delivery Orders
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-2">New Outbound Delivery Order</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border shadow-sm space-y-8">
        {/* Status header indicator */}
        <div className="flex items-center justify-between pb-6 border-b">
          <span className="text-sm font-mono text-gray-500">Operation: WH/OUT/AUTO</span>
          <span className={`px-3 py-1 font-bold text-xs rounded-full ${
            hasAnyDeficit
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {hasAnyDeficit ? '⚠️ WILL BE WAITING (Insufficient Stock)' : 'READY TO PICK'}
          </span>
        </div>

        {hasAnyDeficit && (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-sm">
            <p className="font-bold">⚠️ Notice: Inventory Deficit Detected</p>
            <p className="mt-1 text-xs">
              One or more items exceed current on-hand warehouse stock. The order will be saved as <strong>WAITING FOR STOCK</strong> and cannot be validated until incoming receipts replenish the inventory.
            </p>
          </div>
        )}

        {/* Primary Meta Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block font-semibold text-gray-700">Delivery Address / Customer Name *</Label>
            <Input
              placeholder="e.g. Azure Interior / Acme Corp"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
              className="bg-white"
            />
          </div>

          <div>
            <Label className="mb-2 block font-semibold text-gray-700">Source Warehouse *</Label>
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
              {warehouses.length === 0 && <option value="default">Default Warehouse</option>}
            </select>
          </div>

          <div>
            <Label className="mb-2 block font-semibold text-gray-700">Schedule Date</Label>
            <Input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-2 block font-semibold text-gray-700">Responsible</Label>
            <Input value="Inventory Manager (You)" disabled className="bg-gray-50 text-gray-500" />
          </div>
        </div>

        {/* Line Items Section */}
        <div className="pt-6 border-t space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pick & Pack Lines</h2>
              <p className="text-xs text-gray-500">Select products and demand quantities for outbound shipment.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              + Add Item Line
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const selectedProduct = products.find(p => p.id === line.productId);
              const availableStock = getAvailableStock(line.productId, warehouseId);
              const isDeficit = line.quantity > availableStock;

              return (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center p-3 rounded-lg border transition ${
                    isDeficit ? 'bg-red-50/70 border-red-300' : 'bg-gray-50/80 border-gray-200'
                  }`}
                >
                  {/* Product selector */}
                  <div className="flex-1 w-full">
                    <Label className="text-xs text-gray-500 mb-1 block">Product</Label>
                    <select
                      value={line.productId}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].productId = e.target.value;
                        setLines(newLines);
                      }}
                      className="w-full h-10 px-3 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-full sm:w-32">
                    <Label className="text-xs text-gray-500 mb-1 block">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].quantity = Number(e.target.value);
                        setLines(newLines);
                      }}
                      required
                      className={`bg-white ${isDeficit ? 'border-red-400 text-red-700 font-bold' : ''}`}
                    />
                  </div>

                  {/* Stock Availability Indicator */}
                  <div className="w-full sm:w-48 pt-2 sm:pt-5">
                    {isDeficit ? (
                      <span className="text-xs font-bold text-red-600 block">
                        ⚠️ Insufficient (Avail: {availableStock})
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 block">
                        ✓ In Stock (Avail: {availableStock})
                      </span>
                    )}
                  </div>

                  {/* Remove line */}
                  <div className="pt-2 sm:pt-5">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length <= 1}
                      className="text-gray-400 hover:text-red-500 p-2 disabled:opacity-30 transition"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Link href="/deliveries">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || fetchingOptions}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            {loading ? 'Creating...' : 'Create Delivery Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}

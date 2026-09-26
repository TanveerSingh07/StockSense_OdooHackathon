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
}

interface WarehouseOption {
  id: string;
  name: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

export default function NewReceiptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [warehouseId, setWarehouseId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState([{ productId: '', quantity: 10 }]);

  useEffect(() => {
    async function loadOptions() {
      try {
        setFetchingOptions(true);
        const [wRes, sRes, pRes] = await Promise.all([
          fetch('/api/warehouses'),
          fetch('/api/suppliers'),
          fetch('/api/products'),
        ]);

        const [wData, sData, pData] = await Promise.all([
          wRes.json().catch(() => ({})),
          sRes.json().catch(() => ({})),
          pRes.json().catch(() => ({})),
        ]);

        if (wData.success && wData.data?.length) {
          setWarehouses(wData.data);
          setWarehouseId(wData.data[0].id);
        }
        if (sData.success && sData.data?.length) {
          setSuppliers(sData.data);
          setSupplierId(sData.data[0].id);
        }
        if (pData.success && pData.data?.length) {
          setProducts(pData.data);
          if (pData.data[0]) {
            setLines([{ productId: pData.data[0].id, quantity: 10 }]);
          }
        }
      } catch (err) {
        console.error('Failed to load form options:', err);
      } finally {
        setFetchingOptions(false);
      }
    }

    loadOptions();
  }, []);

  const handleAddLine = () => {
    const defaultProdId = products[0]?.id || '';
    setLines([...lines, { productId: defaultProdId, quantity: 1 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) {
      alert('Please select a warehouse.');
      return;
    }

    // Must have either an existing supplier or new supplier name
    if (!supplierId && !newSupplierName.trim()) {
      alert('Please select or specify a supplier.');
      return;
    }

    const validLines = lines.filter(l => l.productId && l.quantity > 0);
    if (!validLines.length) {
      alert('Please add at least one product line with quantity > 0.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        warehouseId,
        lines: validLines,
      };

      if (supplierId === '__NEW__') {
        payload.supplierName = newSupplierName.trim();
      } else {
        payload.supplierId = supplierId;
      }

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create receipt');
      }

      router.push('/receipts');
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
          <Link href="/receipts" className="text-sm font-semibold text-gray-500 hover:text-gray-800">
            ← Back to Receipts
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-2">New Inbound Receipt</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border shadow-sm space-y-8">
        {/* Status indicator mockup (Draft stage) */}
        <div className="flex items-center justify-between pb-6 border-b">
          <span className="text-sm font-mono text-gray-500">Operation: WH/IN/AUTO</span>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
            DRAFT (Ready to Create)
          </span>
        </div>

        {/* Primary Meta Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="mb-2 block font-semibold text-gray-700">Receive From (Supplier) *</Label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-10 px-3 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="__NEW__">+ Add New Supplier...</option>
            </select>

            {supplierId === '__NEW__' && (
              <div className="mt-3">
                <Input
                  placeholder="Enter new supplier name..."
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 block font-semibold text-gray-700">Destination Warehouse *</Label>
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
              <h2 className="text-lg font-bold text-gray-900">Products to Receive</h2>
              <p className="text-xs text-gray-500">Add product items and quantities to be stocked into warehouse inventory.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              + Add Product Line
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const selectedProduct = products.find(p => p.id === line.productId);
              return (
                <div key={idx} className="flex gap-4 items-center bg-gray-50/80 p-3 rounded-lg border">
                  {/* Product selector */}
                  <div className="flex-1">
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
                  <div className="w-32">
                    <Label className="text-xs text-gray-500 mb-1 block">Quantity</Label>
                    <div className="relative">
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
                        className="bg-white"
                      />
                    </div>
                  </div>

                  {/* Unit label */}
                  <div className="w-20 pt-5 text-xs text-gray-500 font-medium">
                    {selectedProduct?.unit || 'Units'}
                  </div>

                  {/* Remove line */}
                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length <= 1}
                      className="text-gray-400 hover:text-red-500 p-2 disabled:opacity-30 transition"
                      title="Remove line"
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
          <Link href="/receipts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || fetchingOptions} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
            {loading ? 'Creating...' : 'Save as Draft'}
          </Button>
        </div>
      </form>
    </div>
  );
}

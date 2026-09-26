'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowDownLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';

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

    if (!supplierId && !newSupplierName.trim()) {
      alert('Please select or specify a supplier.');
      return;
    }

    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 text-[#F0F6FC]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link
            href="/receipts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Receipts</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5">
            <ArrowDownLeft className="h-6 w-6 text-sky-400" />
            <span>New Inbound Receipt</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Receive incoming vendor shipment into warehouse stock.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#161B22] p-6 sm:p-8 rounded-xl border border-white/[0.08] shadow-sm space-y-6"
      >
        {/* Status indicator */}
        <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
          <span className="text-xs font-mono text-slate-400">Operation: WH/IN/AUTO</span>
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs rounded-lg">
            DRAFT (Ready to Create)
          </span>
        </div>

        {/* Primary Meta Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label className="mb-2 block text-xs font-medium text-slate-300">Receive From (Supplier) *</Label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-10 px-3 border border-white/[0.1] rounded-lg text-xs bg-[#0D1117] text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
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
                  className="bg-[#0D1117] border-white/[0.1] text-white text-xs placeholder-slate-500"
                />
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 block text-xs font-medium text-slate-300">Destination Warehouse *</Label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full h-10 px-3 border border-white/[0.1] rounded-lg text-xs bg-[#0D1117] text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
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
            <Label className="mb-2 block text-xs font-medium text-slate-300">Schedule Date</Label>
            <Input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-[#0D1117] border-white/[0.1] text-white text-xs"
            />
          </div>

          <div>
            <Label className="mb-2 block text-xs font-medium text-slate-300">Responsible</Label>
            <Input
              value="Inventory Manager (You)"
              disabled
              className="bg-white/[0.02] border-white/[0.06] text-slate-400 text-xs cursor-not-allowed"
            />
          </div>
        </div>

        {/* Line Items Section */}
        <div className="pt-5 border-t border-white/[0.08] space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-white">Products to Receive</h2>
              <p className="text-xs text-slate-400">Add product items and quantities to be stocked into warehouse inventory.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="h-8 text-xs font-medium text-sky-400 border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/20 hover:text-sky-300"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Product Line</span>
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const selectedProduct = products.find((p) => p.id === line.productId);
              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-[#0D1117] p-3.5 rounded-lg border border-white/[0.08]"
                >
                  {/* Product selector */}
                  <div className="flex-1 w-full">
                    <Label className="text-[11px] text-slate-400 mb-1 block">Product</Label>
                    <select
                      value={line.productId}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].productId = e.target.value;
                        setLines(newLines);
                      }}
                      className="w-full h-9 px-3 border border-white/[0.1] rounded-lg text-xs bg-[#161B22] text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
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
                    <Label className="text-[11px] text-slate-400 mb-1 block">Quantity</Label>
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
                      className="h-9 bg-[#161B22] border-white/[0.1] text-white text-xs font-mono"
                    />
                  </div>

                  {/* Unit label */}
                  <div className="w-20 pt-0 sm:pt-4 text-xs text-slate-400 font-medium">
                    {selectedProduct?.unit || 'Units'}
                  </div>

                  {/* Remove line */}
                  <div className="pt-0 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length <= 1}
                      className="text-slate-400 hover:text-red-400 p-1.5 disabled:opacity-20 transition-colors cursor-pointer"
                      title="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-5 border-t border-white/[0.08]">
          <Link href="/receipts">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 text-xs font-semibold bg-[#0D1117] hover:bg-[#1F242C] border-white/[0.1] text-slate-300"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || fetchingOptions}
            className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Save as Draft'}
          </Button>
        </div>
      </form>
    </div>
  );
}

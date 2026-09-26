'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowUpRight, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
    const prod = products.find((p) => p.id === prodId);
    if (!prod || !prod.levels) return 0;
    const lvl = prod.levels.find((l) => l.warehouseId === whId);
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

  const hasAnyDeficit = lines.some((l) => {
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

    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 text-[#dae2fd]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link
            href="/deliveries"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] hover:text-[#dae2fd] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Delivery Orders</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dae2fd] mt-2 flex items-center gap-2.5">
            <ArrowUpRight className="h-6 w-6 text-[#ffc174]" />
            <span>New Outbound Delivery Order</span>
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">Dispatch products and deduct warehouse inventory upon fulfillment.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#131b2e] p-6 sm:p-8 rounded-xl border border-[#2d3449]/70 shadow-sm space-y-6"
      >
        {/* Status header indicator */}
        <div className="flex items-center justify-between pb-5 border-b border-[#2d3449]/70">
          <span className="text-xs font-mono text-[#94a3b8]">Operation: WH/OUT/AUTO</span>
          <span
            className={`px-2.5 py-1 font-bold text-xs rounded-lg border ${
              hasAnyDeficit
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-[#ffc174]/10 text-[#ffc174] border-[#ffc174]/20'
            }`}
          >
            {hasAnyDeficit ? '⚠️ WILL BE WAITING (Insufficient Stock)' : 'READY TO PICK'}
          </span>
        </div>

        {hasAnyDeficit && (
          <div className="p-4 bg-amber-500/[0.08] text-amber-300 rounded-xl border border-amber-500/20 text-xs flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Inventory Deficit Detected</p>
              <p className="mt-1 text-[#b4c6d4]">
                One or more items exceed current on-hand warehouse stock. The order will be saved as <strong>WAITING FOR STOCK</strong> and cannot be validated until incoming receipts replenish the inventory.
              </p>
            </div>
          </div>
        )}

        {/* Primary Meta Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label className="mb-2 block text-xs font-medium text-[#b4c6d4]">Delivery Address / Customer Name *</Label>
            <Input
              placeholder="e.g. Azure Interior / Acme Corp"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
              className="bg-[#0b1326] border-[#2d3449]/70 text-[#dae2fd] text-xs placeholder-[#6b7280]"
            />
          </div>

          <div>
            <Label className="mb-2 block text-xs font-medium text-[#b4c6d4]">Source Warehouse *</Label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full h-10 px-3 border border-[#2d3449]/70 rounded-lg text-xs bg-[#0b1326] text-[#dae2fd] focus:outline-none focus:border-[#ffc174] transition-colors cursor-pointer"
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
            <Label className="mb-2 block text-xs font-medium text-[#b4c6d4]">Schedule Date</Label>
            <Input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-[#0b1326] border-[#2d3449]/70 text-[#dae2fd] text-xs"
            />
          </div>

          <div>
            <Label className="mb-2 block text-xs font-medium text-[#b4c6d4]">Responsible</Label>
            <Input
              value="Inventory Manager (You)"
              disabled
              className="bg-[#131b2e]/60 border-[#2d3449]/50 text-[#94a3b8] text-xs cursor-not-allowed"
            />
          </div>
        </div>

        {/* Line Items Section */}
        <div className="pt-5 border-t border-[#2d3449]/70 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-[#dae2fd]">Pick & Pack Lines</h2>
              <p className="text-xs text-[#94a3b8]">Select products and demand quantities for outbound shipment.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="h-8 text-xs font-medium text-[#ffc174] border-[#ffc174]/20 bg-[#ffc174]/10 hover:bg-[#ffc174]/20 hover:text-[#ffd49d]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Item Line</span>
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const selectedProduct = products.find((p) => p.id === line.productId);
              const availableStock = getAvailableStock(line.productId, warehouseId);
              const isDeficit = line.quantity > availableStock;

              return (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3.5 rounded-lg border transition ${
                    isDeficit
                      ? 'bg-red-500/[0.06] border-red-500/30'
                      : 'bg-[#0b1326] border-[#2d3449]/70'
                  }`}
                >
                  {/* Product selector */}
                  <div className="flex-1 w-full">
                    <Label className="text-[11px] text-[#94a3b8] mb-1 block">Product</Label>
                    <select
                      value={line.productId}
                      onChange={(e) => {
                        const newLines = [...lines];
                        newLines[idx].productId = e.target.value;
                        setLines(newLines);
                      }}
                      className="w-full h-9 px-3 border border-[#2d3449]/70 rounded-lg text-xs bg-[#131b2e] text-[#dae2fd] focus:outline-none focus:border-[#ffc174] transition-colors cursor-pointer"
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
                    <Label className="text-[11px] text-[#94a3b8] mb-1 block">Quantity</Label>
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
                      className={`h-9 bg-[#131b2e] border-[#2d3449]/70 text-[#dae2fd] text-xs font-mono ${
                        isDeficit ? 'border-red-500 text-red-400 font-bold' : ''
                      }`}
                    />
                  </div>

                  {/* Stock Availability Indicator */}
                  <div className="w-full sm:w-44 pt-0 sm:pt-4">
                    {isDeficit ? (
                      <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Deficit (Avail: {availableStock})</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#ffc174] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>In Stock (Avail: {availableStock})</span>
                      </span>
                    )}
                  </div>

                  {/* Remove line */}
                  <div className="pt-0 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lines.length <= 1}
                      className="text-[#94a3b8] hover:text-red-400 p-1.5 disabled:opacity-20 transition-colors cursor-pointer"
                      title="Remove item"
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
        <div className="flex justify-end gap-3 pt-5 border-t border-[#2d3449]/70">
          <Link href="/deliveries">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-4 text-xs font-semibold bg-[#0b1326] hover:bg-[#171f33] border-[#2d3449]/70 text-[#b4c6d4]"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || fetchingOptions}
            className="h-9 px-4 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] shadow-sm shadow-[#ffc174]/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Delivery Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}

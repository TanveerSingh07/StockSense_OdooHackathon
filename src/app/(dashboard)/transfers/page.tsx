"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Plus, Trash2, CheckCircle2, Clock } from "lucide-react";

type Warehouse = { id: string; name: string };
type Product = { id: string; name: string; sku: string };
type TransferLine = {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
};
type Transfer = {
  id: string;
  fromWarehouse: string;
  toWarehouse: string;
  fromWarehouseName: string;
  toWarehouseName: string;
  status: "DRAFT" | "DONE";
  createdAt: string;
  lines: TransferLine[];
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [lines, setLines] = useState<TransferLine[]>([
    { productId: "", quantity: 1 },
  ]);
  const [creating, setCreating] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [tRes, wRes, pRes] = await Promise.all([
        fetch("/api/transfers"),
        fetch("/api/warehouses"),
        fetch("/api/products"),
      ]);
      const [tData, wData, pData] = await Promise.all([
        tRes.json(),
        wRes.json(),
        pRes.json(),
      ]);
      if (tData.success) setTransfers(tData.data);
      if (wData.success) setWarehouses(wData.data);
      if (pData.success) setProducts(pData.data);
    } catch (e) {
      console.error("Failed to load transfers data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function addLine() {
    setLines([...lines, { productId: "", quantity: 1 }]);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(
    index: number,
    field: "productId" | "quantity",
    value: string | number
  ) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!fromWarehouse || !toWarehouse) {
      alert("Select both source and destination warehouses");
      return;
    }
    if (fromWarehouse === toWarehouse) {
      alert("Source and destination warehouses must be different");
      return;
    }
    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      alert("Add at least one product line");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromWarehouse, toWarehouse, lines: validLines }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setFromWarehouse("");
      setToWarehouse("");
      setLines([{ productId: "", quantity: 1 }]);
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Failed to create transfer");
    } finally {
      setCreating(false);
    }
  }

  async function handleValidate(id: string) {
    setValidatingId(id);
    try {
      const res = await fetch(`/api/transfers/${id}/validate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await loadAll();
    } catch (err: any) {
      alert(err.message || "Failed to validate transfer");
    } finally {
      setValidatingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 text-[#dae2fd]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#131b2e] border border-[#ffc174]/30 text-[#ffc174] flex items-center justify-center shadow-md">
          <ArrowLeftRight className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dae2fd]">
            Internal Transfers
          </h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-0.5">
            Relocate stock across internal warehouses with instantaneous ledger audit updates.
          </p>
        </div>
      </div>

      {/* Create Form Card */}
      <form
        onSubmit={handleCreate}
        className="bg-[#131b2e] p-5 sm:p-6 rounded-2xl border border-[#2d3449]/80 shadow-lg space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#2d3449]/60">
          <h2 className="text-sm font-semibold text-[#dae2fd] tracking-tight">
            Create New Transfer
          </h2>
          <span className="text-[11px] font-mono text-[#ffc174] bg-[#ffc174]/10 px-2 py-0.5 rounded border border-[#ffc174]/20">
            DRAFT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] block mb-1.5 uppercase tracking-wider font-mono">
              Source Warehouse
            </label>
            <select
              value={fromWarehouse}
              onChange={(e) => setFromWarehouse(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0b1326] border border-[#2d3449]/80 rounded-lg text-[#dae2fd] focus:outline-none focus:border-[#ffc174] focus:ring-1 focus:ring-[#ffc174]/20 transition-all"
            >
              <option value="">Select source warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#131b2e] text-[#dae2fd]">
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] block mb-1.5 uppercase tracking-wider font-mono">
              Destination Warehouse
            </label>
            <select
              value={toWarehouse}
              onChange={(e) => setToWarehouse(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0b1326] border border-[#2d3449]/80 rounded-lg text-[#dae2fd] focus:outline-none focus:border-[#ffc174] focus:ring-1 focus:ring-[#ffc174]/20 transition-all"
            >
              <option value="">Select destination warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#131b2e] text-[#dae2fd]">
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lines */}
        <div className="space-y-2.5 pt-2">
          <label className="text-xs font-semibold text-[#94a3b8] block uppercase tracking-wider font-mono">
            Product Items & Quantities
          </label>
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2.5 items-center">
              <select
                value={line.productId}
                onChange={(e) => updateLine(i, "productId", e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-[#0b1326] border border-[#2d3449]/80 rounded-lg text-[#dae2fd] focus:outline-none focus:border-[#ffc174] focus:ring-1 focus:ring-[#ffc174]/20 transition-all"
              >
                <option value="">Select product to move</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#131b2e] text-[#dae2fd]">
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <div className="w-28 flex items-center bg-[#0b1326] border border-[#2d3449]/80 rounded-lg overflow-hidden focus-within:border-[#ffc174]">
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(i, "quantity", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-xs bg-transparent text-[#dae2fd] outline-none"
                />
                <span className="text-[10px] text-[#94a3b8] pr-2.5 font-mono">units</span>
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="p-2 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded-lg transition-colors"
                  title="Remove item line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 text-xs text-[#ffc174] hover:text-[#ffc174]/80 font-medium py-1 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add another item
          </button>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={creating}
            className="py-2.5 px-5 text-xs font-bold bg-[#ffc174] hover:bg-[#ffc174]/90 text-[#090D16] rounded-lg shadow-sm shadow-[#ffc174]/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {creating ? "Creating Transfer..." : "Generate Internal Transfer"}
          </button>
        </div>
      </form>

      {/* Transfer List Table Card */}
      <div className="border border-[#2d3449]/80 rounded-2xl bg-[#131b2e] shadow-lg overflow-hidden">
        <div className="p-4 border-b border-[#2d3449]/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#dae2fd]">
            Transfer History & Execution
          </h2>
          <span className="text-xs text-[#94a3b8] font-mono">
            {transfers.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#171f33] border-b border-[#2d3449] text-[#94a3b8] font-semibold uppercase tracking-wider text-[11px] font-mono">
                <th className="p-3.5">Source</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Products</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d3449]/50">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-[#171f33]/60 transition-colors">
                  <td className="p-3.5 font-medium text-[#dae2fd]">
                    {t.fromWarehouseName}
                  </td>
                  <td className="p-3.5 font-medium text-[#dae2fd]">
                    {t.toWarehouseName}
                  </td>
                  <td className="p-3.5 text-[#94a3b8]">
                    <div className="flex flex-wrap gap-1.5">
                      {t.lines.map((l, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#171f33] border border-[#2d3449] text-[11px] text-[#dae2fd]"
                        >
                          <span className="font-semibold text-[#ffc174]">{l.quantity}x</span> {l.productName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        t.status === "DONE"
                          ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30"
                          : "bg-[#ffc174]/15 text-[#ffc174] border-[#ffc174]/30"
                      }`}
                    >
                      {t.status === "DONE" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> DONE
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" /> DRAFT
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {t.status === "DRAFT" ? (
                      <button
                        onClick={() => handleValidate(t.id)}
                        disabled={validatingId === t.id}
                        className="px-3 py-1 text-xs font-semibold bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/30 hover:bg-[#ffc174]/25 rounded-md transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {validatingId === t.id ? "Validating..." : "Validate Transfer"}
                      </button>
                    ) : (
                      <span className="text-[#94a3b8] text-[11px] font-mono">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-[#94a3b8]">
                    No internal transfers recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
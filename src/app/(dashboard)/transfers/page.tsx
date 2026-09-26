"use client";

import { useEffect, useState } from "react";

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
    setLoading(false);
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

  function updateLine(index: number, field: "productId" | "quantity", value: string | number) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!fromWarehouse || !toWarehouse) {
      alert("Select both warehouses");
      return;
    }
    if (fromWarehouse === toWarehouse) {
      alert("Source and destination must differ");
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
      const res = await fetch(`/api/transfers/${id}/validate`, { method: "POST" });
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
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 text-[#F0F6FC]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Internal Transfers
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Move stock between warehouses. Validating a transfer immediately updates stock levels.
        </p>
      </div>

      {/* Create Form */}
      <form
        onSubmit={handleCreate}
        className="bg-[#161B22] p-5 rounded-xl border border-white/[0.08] shadow-sm space-y-4"
      >
        <h2 className="text-sm font-semibold text-white">New Transfer</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              From Warehouse
            </label>
            <select
              value={fromWarehouse}
              onChange={(e) => setFromWarehouse(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              To Warehouse
            </label>
            <select
              value={toWarehouse}
              onChange={(e) => setToWarehouse(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 block">Product Lines</label>
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={line.productId}
                onChange={(e) => updateLine(i, "productId", e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => updateLine(i, "quantity", Number(e.target.value))}
                className="w-24 px-3 py-2 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="text-xs text-red-400 hover:text-red-300 px-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            + Add another product
          </button>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="py-2 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Transfer"}
        </button>
      </form>

      {/* Transfer List */}
      <div className="border border-white/[0.08] rounded-xl bg-[#161B22] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.08] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="p-3.5">From</th>
              <th className="p-3.5">To</th>
              <th className="p-3.5">Lines</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3.5 text-white">{t.fromWarehouseName}</td>
                <td className="p-3.5 text-white">{t.toWarehouseName}</td>
                <td className="p-3.5 text-slate-300">
                  {t.lines.map((l) => `${l.productName} x${l.quantity}`).join(", ")}
                </td>
                <td className="p-3.5 text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      t.status === "DONE"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="p-3.5 text-center">
                  {t.status === "DRAFT" ? (
                    <button
                      onClick={() => handleValidate(t.id)}
                      disabled={validatingId === t.id}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                    >
                      {validatingId === t.id ? "Validating..." : "Validate"}
                    </button>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
            {transfers.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No transfers yet — create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
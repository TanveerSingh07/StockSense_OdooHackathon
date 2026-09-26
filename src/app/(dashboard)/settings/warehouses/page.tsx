'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Plus, CheckCircle2 } from 'lucide-react';

interface WarehouseItem {
  id: string;
  name: string;
}

export default function WarehousesSettingsPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      if (data.success && data.data) {
        setWarehouses(data.data);
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseName.trim()) return;

    try {
      setCreating(true);
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWarehouseName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create warehouse');
      }
      setNewWarehouseName('');
      await fetchWarehouses();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 text-[#F0F6FC]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Warehouse & Location Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage physical warehouse facilities, stock locations, and dispatch depots.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Warehouse List */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-white">Active Warehouses</h2>
            <span className="text-xs bg-white/[0.04] text-slate-400 px-2 py-0.5 rounded-full font-mono border border-white/[0.08]">
              {warehouses.length} facility(s)
            </span>
          </div>

          <div className="border border-white/[0.08] rounded-xl bg-[#161B22] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.08] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Facility Name</th>
                  <th className="p-3.5">Identifier</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {warehouses.map((w) => {
                  const code = w.name.slice(0, 3).toUpperCase();
                  return (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-emerald-400">{code}</td>
                      <td className="p-3.5 font-medium text-white">{w.name}</td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-400">{w.id}</td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {warehouses.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No warehouses defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Warehouse Form */}
        <div>
          <div className="bg-[#161B22] p-5 rounded-xl border border-white/[0.08] shadow-sm space-y-4 sticky top-24">
            <div>
              <h2 className="text-sm font-semibold text-white">Add New Facility</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Register a new warehouse to track receipts, stock levels, and dispatches.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-slate-300 block mb-1.5">Warehouse Name *</Label>
                <input
                  placeholder="e.g. Central Hub, West Coast Depot"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-[#0D1117] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !newWarehouseName.trim()}
                className="w-full py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{creating ? 'Creating...' : 'Create Warehouse'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
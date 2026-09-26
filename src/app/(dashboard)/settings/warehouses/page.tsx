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
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 text-[#dae2fd]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dae2fd]">Warehouse & Location Settings</h1>
        <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
          Manage physical warehouse facilities, stock locations, and dispatch depots.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Warehouse List */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-[#dae2fd]">Active Warehouses</h2>
            <span className="text-xs bg-[#131b2e] text-[#94a3b8] px-2 py-0.5 rounded-full font-mono border border-[#2d3449]/70">
              {warehouses.length} facility(s)
            </span>
          </div>

          <div className="border border-[#2d3449]/70 rounded-xl bg-[#131b2e] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#131b2e]/60 border-b border-[#2d3449]/70 text-[#94a3b8] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Facility Name</th>
                  <th className="p-3.5">Identifier</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3449]/50">
                {warehouses.map((w) => {
                  const code = w.name.slice(0, 3).toUpperCase();
                  return (
                    <tr key={w.id} className="hover:bg-[#171f33]/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#ffc174]">{code}</td>
                      <td className="p-3.5 font-medium text-[#dae2fd]">{w.name}</td>
                      <td className="p-3.5 font-mono text-[10px] text-[#94a3b8]">{w.id}</td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/30">
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {warehouses.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#94a3b8]">
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
          <div className="bg-[#131b2e] p-5 rounded-xl border border-[#2d3449]/70 shadow-sm space-y-4 sticky top-24">
            <div>
              <h2 className="text-sm font-semibold text-[#dae2fd]">Add New Facility</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Register a new warehouse to track receipts, stock levels, and dispatches.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-[#b4c6d4] block mb-1.5">Warehouse Name *</Label>
                <input
                  placeholder="e.g. Central Hub, West Coast Depot"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-[#0b1326] border border-[#2d3449]/70 rounded-lg text-[#dae2fd] placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#ffc174]/20 focus:border-[#ffc174] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !newWarehouseName.trim()}
                className="w-full py-2 px-3 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-lg shadow-sm shadow-[#ffc174]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
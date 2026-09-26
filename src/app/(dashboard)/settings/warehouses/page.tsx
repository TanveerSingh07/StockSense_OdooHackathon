'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Warehouse & Location Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage physical warehouse facilities, stock locations, and dispatch depots.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Warehouse List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Active Warehouses</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-mono">
              {warehouses.length} facility(s)
            </span>
          </div>

          <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Short Code</th>
                  <th className="p-4">Facility Name</th>
                  <th className="p-4">Identifier</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {warehouses.map((w) => {
                  const code = w.name.slice(0, 3).toUpperCase();
                  return (
                    <tr key={w.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-mono font-bold text-blue-600">{code}</td>
                      <td className="p-4 font-semibold text-gray-900">{w.name}</td>
                      <td className="p-4 font-mono text-xs text-gray-400">{w.id}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {warehouses.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
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
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900">Add New Facility</h2>
            <p className="text-xs text-gray-500">
              Create a new physical or virtual warehouse to track receipts, stock levels, and deliveries.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-700 block mb-1.5">Warehouse Name *</Label>
                <Input
                  placeholder="e.g. Central Hub, West Coast Depot"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={creating || !newWarehouseName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {creating ? 'Creating...' : '+ Create Warehouse'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

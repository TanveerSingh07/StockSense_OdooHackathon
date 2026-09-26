'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Warehouse as WarehouseIcon, Tag, FileText, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { useTransition } from 'react';

interface WarehouseOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface DashboardFilterBarProps {
  warehouses: WarehouseOption[];
  categories: CategoryOption[];
  activeWarehouseId?: string;
  activeCategoryId?: string;
  activeDocType?: string;
  activeStatus?: string;
}

export function DashboardFilterBar({
  warehouses,
  categories,
  activeWarehouseId = 'all',
  activeCategoryId = 'all',
  activeDocType = 'all',
  activeStatus = 'all',
}: DashboardFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (!value || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `/?${query}` : '/');
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push('/');
    });
  };

  const hasActiveFilters =
    activeWarehouseId !== 'all' ||
    activeCategoryId !== 'all' ||
    activeDocType !== 'all' ||
    activeStatus !== 'all';

  const selectedWarehouse = warehouses.find((w) => w.id === activeWarehouseId);
  const selectedCategory = categories.find((c) => c.id === activeCategoryId);

  return (
    <div className="bg-[#131b2e] border border-[#2d3449]/70 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#b4c6d4]">
          <Filter className="h-4 w-4 text-[#ffc174]" />
          <span>Dashboard Filters</span>
          {isPending && (
            <span className="text-[10px] lowercase font-normal text-[#ffc174] animate-pulse bg-[#ffc174]/10 px-2 py-0.5 rounded border border-[#ffc174]/20">
              updating...
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 text-xs font-medium text-[#94a3b8] hover:text-[#dae2fd] transition-colors bg-[#131b2e] hover:bg-[#222a3d] border border-[#2d3449]/70 px-2.5 py-1 rounded-lg cursor-pointer self-start md:self-auto"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Warehouse Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#94a3b8] flex items-center gap-1">
            <WarehouseIcon className="h-3 w-3 text-[#94a3b8]" />
            <span>Warehouse</span>
          </label>
          <select
            value={activeWarehouseId}
            onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
            className="w-full bg-[#0b1326] border border-[#2d3449]/70 rounded-lg px-3 py-1.5 text-xs text-[#dae2fd] focus:outline-none focus:border-[#ffc174] transition-colors cursor-pointer"
          >
            <option value="all">All Warehouses ({warehouses.length})</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Category Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#94a3b8] flex items-center gap-1">
            <Tag className="h-3 w-3 text-[#94a3b8]" />
            <span>Category</span>
          </label>
          <select
            value={activeCategoryId}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            className="w-full bg-[#0b1326] border border-[#2d3449]/70 rounded-lg px-3 py-1.5 text-xs text-[#dae2fd] focus:outline-none focus:border-[#ffc174] transition-colors cursor-pointer"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Document Type Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#94a3b8] flex items-center gap-1">
            <FileText className="h-3 w-3 text-[#94a3b8]" />
            <span>Document Type</span>
          </label>
          <select
            value={activeDocType}
            onChange={(e) => handleFilterChange('docType', e.target.value)}
            className="w-full bg-[#0b1326] border border-[#2d3449]/70 rounded-lg px-3 py-1.5 text-xs text-[#dae2fd] focus:outline-none focus:border-[#ffc174] transition-colors cursor-pointer"
          >
            <option value="all">All Document Types</option>
            <option value="RECEIPT">Receipts (Incoming)</option>
            <option value="DELIVERY">Deliveries (Outgoing)</option>
          </select>
        </div>

        {/* 4. Status Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[#94a3b8] flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-[#94a3b8]" />
            <span>Document Status</span>
          </label>
          <select
            value={activeStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full bg-[#0b1326] border border-[#2d3449]/70 rounded-lg px-3 py-1.5 text-xs text-[#dae2fd] focus:outline-none focus:border-[#ffc174] transition-colors cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Pending / Draft</option>
            <option value="DONE">Completed / Done</option>
          </select>
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-[#2d3449]/50 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#94a3b8]">Active filters:</span>
          {activeWarehouseId !== 'all' && selectedWarehouse && (
            <span className="inline-flex items-center gap-1 bg-[#ffc174]/10 text-[#ffc174] border border-[#ffc174]/20 px-2 py-0.5 rounded-md text-[11px]">
              <span>Warehouse: {selectedWarehouse.name}</span>
              <button
                onClick={() => handleFilterChange('warehouseId', 'all')}
                className="hover:text-[#ffd49d] cursor-pointer ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {activeCategoryId !== 'all' && selectedCategory && (
            <span className="inline-flex items-center gap-1 bg-[#ffc174]/10 text-[#ffc174] border border-[#ffc174]/20 px-2 py-0.5 rounded-md text-[11px]">
              <span>Category: {selectedCategory.name}</span>
              <button
                onClick={() => handleFilterChange('categoryId', 'all')}
                className="hover:text-[#ffd49d] cursor-pointer ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {activeDocType !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md text-[11px]">
              <span>Type: {activeDocType}</span>
              <button
                onClick={() => handleFilterChange('docType', 'all')}
                className="hover:text-sky-200 cursor-pointer ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {activeStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md text-[11px]">
              <span>Status: {activeStatus === 'DRAFT' ? 'Pending (Draft)' : 'Done'}</span>
              <button
                onClick={() => handleFilterChange('status', 'all')}
                className="hover:text-purple-200 cursor-pointer ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

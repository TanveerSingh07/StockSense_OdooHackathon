'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Package, 
  AlertTriangle, 
  X, 
  Activity, 
  Layers, 
  MoreVertical,
  ChevronDown,
  Warehouse as WarehouseIcon,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { OperationsShell } from '@/components/layout/operations-shell';
import { ProductFormSlideOver } from '@/components/products/product-form-slideover';
import { ProductDetailSheet } from '@/components/products/product-detail-sheet';
import { FloatingBulkBar } from '@/components/products/floating-bulk-bar';
import { AnimatedCounter } from '@/components/products/animated-counter';
import { CommandPalette } from '@/components/products/command-palette';

export interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}

export interface StockLevel {
  id: string;
  warehouseId: string;
  quantity: number;
  warehouse?: { id: string; name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category: Category;
  unit: string;
  reorderPoint: number;
  totalQuantity: number;
  isLowStock: boolean;
  levels: StockLevel[];
}

interface Warehouse {
  id: string;
  name: string;
}

const DEMO_PRODUCTS = [
  { name: 'Wireless Barcode Scanner Handheld', sku: 'ELEC-SCN-001', categoryName: 'Electronics', unit: 'Units', reorderPoint: 5, initialStock: 18 },
  { name: 'Industrial Label Printer Thermal', sku: 'ELEC-PRN-002', categoryName: 'Electronics', unit: 'Units', reorderPoint: 3, initialStock: 2 },
  { name: 'M8 Hex Bolts Grade 8.8 (100-pack)', sku: 'FSTN-BLT-M8', categoryName: 'Hardware', unit: 'Boxes', reorderPoint: 25, initialStock: 60 },
  { name: 'Heavy Duty Stainless Steel Hinges', sku: 'FSTN-HNG-SS', categoryName: 'Hardware', unit: 'Pieces', reorderPoint: 40, initialStock: 0 },
  { name: 'Aluminum Extrusion Profile 2020 (1m)', sku: 'RAW-ALU-2020', categoryName: 'Raw Materials', unit: 'Pieces', reorderPoint: 50, initialStock: 110 },
  { name: 'Corrugated Shipping Cartons (Large)', sku: 'PKG-BOX-LRG', categoryName: 'Packaging', unit: 'Bundles', reorderPoint: 20, initialStock: 15 },
  { name: 'Stretch Film Roll 500mm x 300m', sku: 'PKG-FLM-500', categoryName: 'Packaging', unit: 'Rolls', reorderPoint: 15, initialStock: 42 },
  { name: 'Kevlar Cut-Resistant Work Gloves (L)', sku: 'PPE-GLV-002', categoryName: 'Safety Gear', unit: 'Pairs', reorderPoint: 12, initialStock: 35 },
];

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [activeKpiFilter, setActiveKpiFilter] = useState<'NONE' | 'TOTAL' | 'UNITS' | 'HEALTH' | 'LOW'>('NONE');

  // UI States
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // TanStack Query: Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // TanStack Query: Fetch Warehouses
  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await fetch('/api/warehouses');
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // TanStack Query: Fetch Products
  const {
    data: products = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // Global Click Outside Handler
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
      setShowExportMenu(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Global Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // KPI Metrics Calculation
  const totalProductsCount = products.length;
  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + (p.totalQuantity || 0), 0),
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.isLowStock && p.totalQuantity > 0).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.totalQuantity === 0).length,
    [products]
  );
  const healthyCount = useMemo(
    () => products.filter((p) => !p.isLowStock && p.totalQuantity > 0).length,
    [products]
  );
  const healthPercentage = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.round((healthyCount / products.length) * 100);
  }, [products, healthyCount]);

  // Handle KPI Strip Click Filtering
  const handleKpiCardClick = (kpi: 'TOTAL' | 'UNITS' | 'HEALTH' | 'LOW') => {
    if (activeKpiFilter === kpi) {
      setActiveKpiFilter('NONE');
      setActiveTab('ALL');
    } else {
      setActiveKpiFilter(kpi);
      if (kpi === 'TOTAL') setActiveTab('ALL');
      else if (kpi === 'LOW') setActiveTab('LOW_STOCK');
      else if (kpi === 'HEALTH') setActiveTab('ALL');
      else if (kpi === 'UNITS') setActiveTab('ALL');
    }
  };

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchCategory = p.category?.name?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCategory) return false;
      }

      // Tab filter
      if (activeTab === 'LOW_STOCK' && (!p.isLowStock || p.totalQuantity === 0)) return false;
      if (activeTab === 'OUT_OF_STOCK' && p.totalQuantity > 0) return false;

      // Category filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

      // Warehouse filter
      if (selectedWarehouse !== 'all') {
        const hasWarehouseStock = (p.levels || []).some(
          (lvl) => lvl.warehouseId === selectedWarehouse && lvl.quantity > 0
        );
        if (!hasWarehouseStock) return false;
      }

      // KPI Specific Filter
      if (activeKpiFilter === 'HEALTH' && (p.isLowStock || p.totalQuantity === 0)) return false;
      if (activeKpiFilter === 'LOW' && !p.isLowStock) return false;

      return true;
    });
  }, [products, searchQuery, activeTab, selectedCategory, selectedWarehouse, activeKpiFilter]);

  // Copy SKU
  const handleCopySku = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    toast.success(`SKU "${sku}" copied`);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete product');
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Product[]>(['products'], (old = []) =>
        old.filter((p) => p.id !== deletedId)
      );
      setSelectedProductIds((prev) => prev.filter((id) => id !== deletedId));
      toast.success('Product deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting product');
    },
  });

  const handleDelete = (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Delete "${name}" from catalog?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedProductIds.length} selected products?`)) return;

    const toastId = toast.loading(`Deleting ${selectedProductIds.length} products...`);
    try {
      for (const id of selectedProductIds) {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
      }
      queryClient.setQueryData<Product[]>(['products'], (old = []) =>
        old.filter((p) => !selectedProductIds.includes(p.id))
      );
      setSelectedProductIds([]);
      toast.success('Products deleted', { id: toastId });
    } catch (err: any) {
      toast.error('Failed to delete products', { id: toastId });
    }
  };

  // Bulk Change Category
  const handleBulkChangeCategory = async (newCategoryId: string) => {
    const targetCat = categories.find((c) => c.id === newCategoryId);
    const toastId = toast.loading(`Updating category to "${targetCat?.name}"...`);

    try {
      for (const id of selectedProductIds) {
        const prod = products.find((p) => p.id === id);
        if (prod) {
          await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: prod.name,
              sku: prod.sku,
              categoryId: newCategoryId,
              unit: prod.unit,
              reorderPoint: prod.reorderPoint,
            }),
          });
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedProductIds([]);
      toast.success(`Category updated`, { id: toastId });
    } catch (err: any) {
      toast.error('Failed to update category', { id: toastId });
    }
  };

  // Seed Demo Data
  const handleSeedDemoData = async () => {
    setSeeding(true);
    const toastId = toast.loading('Loading demo catalog...');
    try {
      for (const item of DEMO_PRODUCTS) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Demo products loaded', { id: toastId });
    } catch (err) {
      toast.error('Failed to load demo products', { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  // Export CSV
  const handleExportCSV = (specificItems?: Product[]) => {
    const exportList = specificItems || filteredProducts;
    if (exportList.length === 0) {
      toast.error('No products to export');
      return;
    }
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Unit',
      'Current Stock',
      'Min Reorder Point',
      'Status',
    ];
    const rows = exportList.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category?.name || 'Uncategorized',
      p.unit,
      p.totalQuantity,
      p.reorderPoint,
      p.totalQuantity === 0 ? 'Out of Stock' : p.isLowStock ? 'Low Stock' : 'In Stock',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `inventory-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${exportList.length} products`);
  };

  // Selection Checkbox Handlers
  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Optimistic stock update callback for drawer stepper
  const handleStockAdjusted = (productId: string, warehouseId: string, newQty: number) => {
    queryClient.setQueryData<Product[]>(['products'], (old = []) => {
      return old.map((p) => {
        if (p.id !== productId) return p;
        const levels = p.levels || [];
        const existingIdx = levels.findIndex((l) => l.warehouseId === warehouseId);
        let updatedLevels = [...levels];

        if (existingIdx >= 0) {
          updatedLevels[existingIdx] = {
            ...updatedLevels[existingIdx],
            quantity: newQty,
          };
        } else {
          updatedLevels.push({
            id: `temp_${Date.now()}`,
            warehouseId,
            quantity: newQty,
          });
        }

        const newTotal = updatedLevels.reduce((sum, lvl) => sum + lvl.quantity, 0);
        return {
          ...p,
          levels: updatedLevels,
          totalQuantity: newTotal,
          isLowStock: newTotal <= p.reorderPoint,
        };
      });
    });

    if (sheetProduct && sheetProduct.id === productId) {
      setSheetProduct((prev) => {
        if (!prev) return null;
        const levels = prev.levels || [];
        const existingIdx = levels.findIndex((l) => l.warehouseId === warehouseId);
        let updatedLevels = [...levels];
        if (existingIdx >= 0) {
          updatedLevels[existingIdx] = { ...updatedLevels[existingIdx], quantity: newQty };
        } else {
          updatedLevels.push({ id: `temp_${Date.now()}`, warehouseId, quantity: newQty });
        }
        const newTotal = updatedLevels.reduce((sum, lvl) => sum + lvl.quantity, 0);
        return {
          ...prev,
          levels: updatedLevels,
          totalQuantity: newTotal,
          isLowStock: newTotal <= prev.reorderPoint,
        };
      });
    }
  };

  // Row click opens right Sheet drawer
  const handleRowClick = (product: Product) => {
    setSheetProduct(product);
    setIsSheetOpen(true);
  };

  return (
    <OperationsShell>
      <div className="flex-1 flex flex-col h-full bg-[#0F172A] text-slate-100 font-sans">
        {/* Main Content Layout */}
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
          
          {/* 1. Header: Clean, Solid, Confident Typography */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
                Products
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Manage your catalog, stock levels, and reorder thresholds.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search input with ⌘K */}
              <button
                onClick={() => setIsCommandOpen(true)}
                className="h-9 px-3 text-xs bg-[#1E293B] hover:bg-[#283548] border border-white/[0.08] focus:border-amber-500 rounded-lg text-zinc-300 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Search className="h-3.5 w-3.5 text-zinc-400" />
                <span>Search products...</span>
                <kbd className="ml-2 font-mono text-[10px] bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded text-zinc-400">
                  ⌘K
                </kbd>
              </button>

              {/* Options Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExportMenu(!showExportMenu);
                  }}
                  className="h-9 px-2.5 text-xs font-medium text-zinc-300 hover:text-white bg-[#1E293B] hover:bg-[#283548] border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Options"
                >
                  <MoreVertical className="h-4 w-4 text-zinc-400" />
                </button>

                {showExportMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-1.5 w-48 bg-[#1E293B] border border-white/[0.1] rounded-lg shadow-xl p-1 z-50 text-xs space-y-0.5"
                  >
                    <button
                      onClick={() => {
                        handleExportCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-zinc-200 hover:text-white hover:bg-white/[0.06] rounded transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Export CSV</span>
                    </button>
                    {selectedProductIds.length > 0 && (
                      <button
                        onClick={() => {
                          const selected = products.filter((p) =>
                            selectedProductIds.includes(p.id)
                          );
                          handleExportCSV(selected);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-zinc-200 hover:text-white hover:bg-white/[0.06] rounded transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Export selected ({selectedProductIds.length})</span>
                      </button>
                    )}
                    <div className="my-1 border-t border-white/[0.06]" />
                    <button
                      onClick={() => {
                        handleSeedDemoData();
                        setShowExportMenu(false);
                      }}
                      disabled={seeding}
                      className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>{seeding ? 'Loading...' : 'Seed demo products'}</span>
                    </button>
                    <button
                      onClick={() => {
                        refetch();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Primary [+ Add Product] Button */}
              <button
                onClick={() => {
                  setProductToEdit(null);
                  setIsPanelOpen(true);
                }}
                className="h-9 px-3.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Add product</span>
              </button>
            </div>
          </div>

          {/* 2. Bento KPI Strip: Quiet, Flat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Products */}
            <div
              onClick={() => handleKpiCardClick('TOTAL')}
              className={`p-4 rounded-lg bg-[#1E293B] border border-white/[0.08] hover:border-white/[0.14] transition-colors cursor-pointer flex flex-col justify-between ${
                activeKpiFilter === 'TOTAL' ? 'ring-2 ring-amber-500' : ''
              }`}
            >
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-sm font-normal text-zinc-400">Total products</span>
                <div className="h-7 w-7 rounded bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                  <Package className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-white tracking-tight tabular-nums">
                <AnimatedCounter value={totalProductsCount} />
              </div>
            </div>

            {/* Card 2: Total Units */}
            <div
              onClick={() => handleKpiCardClick('UNITS')}
              className={`p-4 rounded-lg bg-[#1E293B] border border-white/[0.08] hover:border-white/[0.14] transition-colors cursor-pointer flex flex-col justify-between ${
                activeKpiFilter === 'UNITS' ? 'ring-2 ring-amber-500' : ''
              }`}
            >
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-sm font-normal text-zinc-400">Total inventory</span>
                <div className="h-7 w-7 rounded bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                  <Layers className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-white tracking-tight tabular-nums">
                <AnimatedCounter value={totalStockUnits} />
              </div>
            </div>

            {/* Card 3: Reorder Alerts */}
            <div
              onClick={() => handleKpiCardClick('LOW')}
              className={`p-4 rounded-lg bg-[#1E293B] border border-white/[0.08] hover:border-white/[0.14] transition-colors cursor-pointer flex flex-col justify-between ${
                activeKpiFilter === 'LOW'
                  ? 'ring-2 ring-amber-500'
                  : lowStockCount > 0
                  ? 'border-amber-500/30'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-sm font-normal text-zinc-400">Reorder alerts</span>
                <div className={`h-7 w-7 rounded border flex items-center justify-center ${
                  lowStockCount > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/[0.04] border-white/[0.08] text-zinc-300'
                }`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-white tracking-tight tabular-nums">
                <AnimatedCounter value={lowStockCount} />
              </div>
            </div>

            {/* Card 4: Stock Health (Hero 2 Columns) */}
            <div
              onClick={() => handleKpiCardClick('HEALTH')}
              className={`lg:col-span-2 p-4 rounded-lg bg-[#1E293B] border border-white/[0.08] hover:border-white/[0.14] transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                activeKpiFilter === 'HEALTH' ? 'ring-2 ring-amber-500' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="text-sm font-normal text-zinc-400">Stock health</div>
                <div className="text-3xl font-semibold text-white tracking-tight tabular-nums">
                  <AnimatedCounter value={healthPercentage} suffix="%" />
                </div>
                <div className="text-xs text-zinc-400 pt-0.5">
                  {healthyCount} of {products.length} items optimal
                </div>
              </div>

              {/* Quiet Radial Gauge Ring */}
              <div className="flex flex-col items-center justify-center shrink-0 pr-2">
                <div className="relative h-14 w-14 flex items-center justify-center">
                  <svg className="h-14 w-14 -rotate-90 transform" viewBox="0 0 36 36">
                    <path
                      className="text-zinc-700"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${
                        healthPercentage >= 75
                          ? 'text-emerald-500'
                          : healthPercentage >= 40
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                      strokeDasharray={`${healthPercentage}, 100`}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono font-medium text-xs text-zinc-200">
                    {healthPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Filter Bar: Flat & Quiet */}
          <div className="bg-[#1E293B] border border-white/[0.08] rounded-lg p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Tabs [All | Low Stock | Out of Stock] */}
            <div className="flex items-center bg-[#0F172A] p-0.5 rounded-lg border border-white/[0.06] text-xs font-medium">
              <button
                onClick={() => {
                  setActiveTab('ALL');
                  setActiveKpiFilter('NONE');
                }}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ALL'
                    ? 'bg-amber-500 text-zinc-950 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>All</span>
                <span className={`px-1 py-0.2 rounded text-[10px] font-mono ${
                  activeTab === 'ALL' ? 'bg-zinc-950/20 text-zinc-950 font-semibold' : 'bg-white/[0.06] text-zinc-400'
                }`}>
                  {totalProductsCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('LOW_STOCK');
                  setActiveKpiFilter('LOW');
                }}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'LOW_STOCK'
                    ? 'bg-amber-500 text-zinc-950 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Low stock</span>
                <span className={`px-1 py-0.2 rounded text-[10px] font-mono ${
                  activeTab === 'LOW_STOCK' ? 'bg-zinc-950/20 text-zinc-950 font-semibold' : 'bg-white/[0.06] text-zinc-400'
                }`}>
                  {lowStockCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('OUT_OF_STOCK');
                  setActiveKpiFilter('NONE');
                }}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'OUT_OF_STOCK'
                    ? 'bg-amber-500 text-zinc-950 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Out of stock</span>
                <span className={`px-1 py-0.2 rounded text-[10px] font-mono ${
                  activeTab === 'OUT_OF_STOCK' ? 'bg-zinc-950/20 text-zinc-950 font-semibold' : 'bg-white/[0.06] text-zinc-400'
                }`}>
                  {outOfStockCount}
                </span>
              </button>
            </div>

            {/* Right: Category + Warehouse selects */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-40 h-8 pl-2.5 pr-7 bg-[#0F172A] border border-white/[0.08] focus:border-amber-500 rounded-md text-xs text-zinc-200 focus:outline-none transition-colors cursor-pointer appearance-none"
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full sm:w-40 h-8 pl-2.5 pr-7 bg-[#0F172A] border border-white/[0.08] focus:border-amber-500 rounded-md text-xs text-zinc-200 focus:outline-none transition-colors cursor-pointer appearance-none"
                >
                  <option value="all">All warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              </div>

              {(selectedCategory !== 'all' ||
                selectedWarehouse !== 'all' ||
                activeTab !== 'ALL' ||
                searchQuery ||
                activeKpiFilter !== 'NONE') && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedWarehouse('all');
                    setActiveTab('ALL');
                    setActiveKpiFilter('NONE');
                    setSearchQuery('');
                  }}
                  className="h-8 px-2.5 text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 4. Table: Quiet, Clean, Row Dividers */}
          <div className="rounded-lg border border-white/[0.08] bg-[#1E293B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.01] text-zinc-400 font-medium text-xs">
                    <th className="p-3.5 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={
                          filteredProducts.length > 0 &&
                          selectedProductIds.length === filteredProducts.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-white/20 bg-[#0F172A] text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5 hidden md:table-cell">Category</th>
                    <th className="p-3.5">Stock</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right w-16">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-3.5 text-center">
                          <div className="h-4 w-4 bg-white/[0.06] rounded mx-auto" />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-white/[0.06] rounded" />
                            <div className="space-y-1.5">
                              <div className="h-3.5 w-36 bg-white/[0.06] rounded" />
                              <div className="h-2.5 w-20 bg-white/[0.04] rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 hidden md:table-cell">
                          <div className="h-4 w-20 bg-white/[0.06] rounded" />
                        </td>
                        <td className="p-3.5">
                          <div className="h-4 w-28 bg-white/[0.06] rounded" />
                        </td>
                        <td className="p-3.5">
                          <div className="h-5 w-20 bg-white/[0.06] rounded" />
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="h-6 w-8 bg-white/[0.06] rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-zinc-400">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <Package className="h-8 w-8 text-zinc-500 mb-1" />
                          <p className="text-sm font-medium text-zinc-200">No products found</p>
                          <p className="text-xs text-zinc-400 text-center">
                            {searchQuery || selectedCategory !== 'all' || selectedWarehouse !== 'all' || activeTab !== 'ALL'
                              ? 'Try adjusting your filters or search query.'
                              : 'Get started by creating your first catalog product.'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => {
                                setProductToEdit(null);
                                setIsPanelOpen(true);
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-zinc-950 rounded-md transition-colors cursor-pointer"
                            >
                              Add product
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const isOutOfStock = product.totalQuantity === 0;
                      const isLow = product.totalQuantity <= product.reorderPoint;
                      const isSelected = selectedProductIds.includes(product.id);

                      const maxRatio = Math.max(product.reorderPoint * 2, 10);
                      const progressPct = Math.min(
                        100,
                        Math.round((product.totalQuantity / maxRatio) * 100)
                      );
                      const minTickPos = Math.min(95, Math.round((product.reorderPoint / maxRatio) * 100));

                      return (
                        <tr
                          key={product.id}
                          onClick={() => handleRowClick(product)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          {/* Checkbox */}
                          <td
                            className="p-3.5 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelectProduct(product.id, e as any)}
                              className="rounded border-white/20 bg-[#0F172A] text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>

                          {/* Product & SKU */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 shrink-0">
                                <Package className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium text-zinc-100 text-xs">
                                  {product.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[11px] text-zinc-400">
                                    {product.sku}
                                  </span>
                                  <button
                                    onClick={(e) => handleCopySku(product.sku, e)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-zinc-300 transition-opacity cursor-pointer"
                                    title="Copy SKU"
                                  >
                                    {copiedSku === product.sku ? (
                                      <Check className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category Dot + Name */}
                          <td className="p-3.5 hidden md:table-cell text-zinc-300">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                              <span>{product.category?.name || 'Unassigned'}</span>
                            </div>
                          </td>

                          {/* Stock Progress Bar */}
                          <td className="p-3.5">
                            <div className="space-y-1 max-w-[140px]">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-medium text-white font-mono">
                                  {product.totalQuantity}{' '}
                                  <span className="text-zinc-400 text-[10px]">
                                    {product.unit}
                                  </span>
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  min {product.reorderPoint}
                                </span>
                              </div>
                              <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-visible">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isOutOfStock
                                      ? 'bg-rose-500 w-full'
                                      : isLow
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{
                                    width: isOutOfStock ? '100%' : `${Math.max(8, progressPct)}%`,
                                  }}
                                />
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-white/40"
                                  style={{ left: `${minTickPos}%` }}
                                  title={`Reorder point: ${product.reorderPoint}`}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3.5">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                Out of stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                Low stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                In stock
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="p-3.5 text-right relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() =>
                                  setOpenDropdownId(
                                    openDropdownId === product.id ? null : product.id
                                  )
                                }
                                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                                title="Actions"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>

                              {openDropdownId === product.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-[#1E293B] border border-white/[0.1] rounded-lg shadow-xl p-1 z-50 text-xs space-y-0.5">
                                  <button
                                    onClick={() => {
                                      handleRowClick(product);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-zinc-200 hover:text-white hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
                                  >
                                    View details
                                  </button>
                                  <button
                                    onClick={() => {
                                      setProductToEdit(product);
                                      setIsPanelOpen(true);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-zinc-200 hover:text-white hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
                                  >
                                    Edit product
                                  </button>
                                  <div className="my-1 border-t border-white/[0.06]" />
                                  <button
                                    onClick={() => {
                                      handleDelete(product.id, product.name);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 5. Product Detail Sheet Drawer */}
        <ProductDetailSheet
          product={sheetProduct}
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onStockAdjusted={handleStockAdjusted}
          warehouses={warehouses}
        />

        {/* 6. Floating Action Bar */}
        <FloatingBulkBar
          selectedCount={selectedProductIds.length}
          onClearSelection={() => setSelectedProductIds([])}
          onExportSelected={() => {
            const selected = products.filter((p) => selectedProductIds.includes(p.id));
            handleExportCSV(selected);
          }}
          onDeleteSelected={handleBulkDelete}
          onChangeCategory={handleBulkChangeCategory}
          categories={categories}
        />

        {/* 7. Command Palette Modal (⌘K) */}
        <CommandPalette
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          products={products}
          onSelectProduct={(prod) => {
            setSheetProduct(prod);
            setIsSheetOpen(true);
          }}
          onOpenCreateProduct={() => {
            setProductToEdit(null);
            setIsPanelOpen(true);
          }}
        />

        {/* Create / Edit SlideOver Form */}
        <ProductFormSlideOver
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(
              productToEdit ? 'Product updated' : 'Product created'
            );
          }}
          productToEdit={productToEdit}
          categories={categories}
          onCategoryCreated={(newCat) => {
            queryClient.setQueryData<Category[]>(['categories'], (old = []) => [...old, newCat]);
          }}
        />
      </div>
    </OperationsShell>
  );
}

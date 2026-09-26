'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
  Tag,
  Boxes,
  Cpu,
  Wrench,
  Box,
  HardHat,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  Command,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { OperationsShell } from '@/components/layout/operations-shell';
import { ProductFormSlideOver } from '@/components/products/product-form-slideover';
import { ProductDetailSheet } from '@/components/products/product-detail-sheet';
import { FloatingBulkBar } from '@/components/products/floating-bulk-bar';
import { AnimatedCounter } from '@/components/products/animated-counter';
import { CommandPalette } from '@/components/products/command-palette';
import { AmbientGlowMesh } from '@/components/ui/ambient-glow-mesh';

// Single small rotating low-poly cube next to the title (SSR false)
const CubeLogo3D = dynamic(
  () => import('@/components/ui/cube-logo-3d').then((mod) => mod.CubeLogo3D),
  { ssr: false }
);

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
    toast.success(`SKU "${sku}" copied to clipboard`);
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
      toast.success('Product removed from catalog');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting product');
    },
  });

  const handleDelete = (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Are you sure you want to remove "${name}" from catalog?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedProductIds.length} selected product(s)?`
      )
    )
      return;

    const toastId = toast.loading(`Deleting ${selectedProductIds.length} products...`);
    try {
      for (const id of selectedProductIds) {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
      }
      queryClient.setQueryData<Product[]>(['products'], (old = []) =>
        old.filter((p) => !selectedProductIds.includes(p.id))
      );
      setSelectedProductIds([]);
      toast.success('Selected products deleted', { id: toastId });
    } catch (err: any) {
      toast.error('Failed to delete some products', { id: toastId });
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
      toast.success(`Updated category to "${targetCat?.name}" for selected items`, { id: toastId });
    } catch (err: any) {
      toast.error('Failed to update category for some products', { id: toastId });
    }
  };

  // Seed Demo Data
  const handleSeedDemoData = async () => {
    setSeeding(true);
    const toastId = toast.loading('Loading demo inventory catalog...');
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
      toast.success('Demo inventory catalog loaded successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to seed demo products', { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  // Export CSV
  const handleExportCSV = (specificItems?: Product[]) => {
    const exportList = specificItems || filteredProducts;
    if (exportList.length === 0) {
      toast.error('No products available to export');
      return;
    }
    const headers = [
      'SKU / Code',
      'Product Name',
      'Category',
      'Unit',
      'Current Stock',
      'Min Reorder Point',
      'Health Status',
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
      `stocksense-inventory-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${exportList.length} products to CSV`);
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

  // Category Icon Resolver
  const getCategoryIcon = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('elec')) return <Cpu className="h-4 w-4 text-sky-400" />;
    if (name.includes('hard') || name.includes('fast')) return <Wrench className="h-4 w-4 text-amber-400" />;
    if (name.includes('pack')) return <Box className="h-4 w-4 text-slate-400" />;
    if (name.includes('safe') || name.includes('ppe')) return <HardHat className="h-4 w-4 text-emerald-400" />;
    return <Layers className="h-4 w-4 text-indigo-400" />;
  };

  const getCategoryGradient = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('elec')) return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
    if (name.includes('hard') || name.includes('fast')) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    if (name.includes('pack')) return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    if (name.includes('safe') || name.includes('ppe')) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
  };

  // Row click opens right Sheet drawer
  const handleRowClick = (product: Product) => {
    setSheetProduct(product);
    setIsSheetOpen(true);
  };

  return (
    <OperationsShell>
      <div className="flex-1 flex flex-col h-full bg-[#0F172A] text-slate-100 font-sans relative">
        
        {/* Ambient Breathing Lighting & Dot-Grid Texture */}
        <AmbientGlowMesh />

        {/* Main Content Layout */}
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 w-full relative z-10">
          
          {/* 1. Header & Primary Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pt-2">
            <div>
              <div className="flex items-center gap-3">
                <CubeLogo3D />
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none font-sans">
                  Products & <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">Inventory</span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
                Live centralized warehouse catalog, location allocations, and threshold reorders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Command Palette Trigger with ⌘K */}
              <button
                onClick={() => setIsCommandOpen(true)}
                className="h-10 px-3.5 text-xs bg-[#1E293B]/70 hover:bg-[#1E293B] border border-white/10 hover:border-amber-500/40 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2 shadow-xs cursor-pointer group backdrop-blur-md"
              >
                <Search className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Search catalog...</span>
                <kbd className="ml-2 font-mono text-[10px] bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-slate-300">
                  ⌘K
                </kbd>
              </button>

              {/* Options Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExportMenu(!showExportMenu);
                  }}
                  className="h-10 px-3.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#1E293B]/70 hover:bg-[#1E293B] border border-white/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs backdrop-blur-md"
                  title="Options"
                >
                  <MoreVertical className="h-4 w-4 text-slate-400" />
                  <span className="hidden sm:inline">Options</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {showExportMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-52 bg-[#1E293B] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 text-xs space-y-1 backdrop-blur-xl animate-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => {
                        handleExportCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-sky-400" />
                      <span>Export Filtered CSV</span>
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
                        className="w-full text-left px-3 py-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-amber-400" />
                        <span>Export ({selectedProductIds.length}) Selected</span>
                      </button>
                    )}
                    <div className="my-1 border-t border-white/10" />
                    <button
                      onClick={() => {
                        handleSeedDemoData();
                        setShowExportMenu(false);
                      }}
                      disabled={seeding}
                      className="w-full text-left px-3 py-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{seeding ? 'Seeding...' : 'Seed Demo Catalog'}</span>
                    </button>
                    <button
                      onClick={() => {
                        refetch();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-amber-400' : ''}`} />
                      <span>Refresh Live Data</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Prominent Primary CTA (Amber Glow Gradient) */}
              <button
                onClick={() => {
                  setProductToEdit(null);
                  setIsPanelOpen(true);
                }}
                className="h-10 px-5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all flex items-center gap-2 cursor-pointer active:scale-[0.97]"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* 2. Asymmetric Bento KPI Grid (Stock Health = Hero 2-Column Card) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Products (1 Column) */}
            <div
              onClick={() => handleKpiCardClick('TOTAL')}
              className={`p-5 rounded-2xl bg-[#1E293B]/60 backdrop-blur-xl border border-white/8 border-t-white/15 shadow-xl hover:border-amber-500/40 transition-all cursor-pointer relative group flex flex-col justify-between ${
                activeKpiFilter === 'TOTAL' ? 'ring-2 ring-amber-500 bg-amber-500/[0.08]' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Products
                </span>
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-amber-500/30 blur-md" />
                  <div className="relative h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Package className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono tabular-nums">
                  <AnimatedCounter value={totalProductsCount} />
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>Catalog SKUs</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    +100%
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Units (1 Column) */}
            <div
              onClick={() => handleKpiCardClick('UNITS')}
              className={`p-5 rounded-2xl bg-[#1E293B]/60 backdrop-blur-xl border border-white/8 border-t-white/15 shadow-xl hover:border-sky-500/40 transition-all cursor-pointer relative group flex flex-col justify-between ${
                activeKpiFilter === 'UNITS' ? 'ring-2 ring-sky-500 bg-sky-500/[0.08]' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Units
                </span>
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-sky-500/30 blur-md" />
                  <div className="relative h-8 w-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono tabular-nums">
                  <AnimatedCounter value={totalStockUnits} />
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <span>On-hand stock</span>
                  <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                    DC Stock
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Reorder Alerts (1 Column) */}
            <div
              onClick={() => handleKpiCardClick('LOW')}
              className={`p-5 rounded-2xl border backdrop-blur-xl shadow-xl transition-all cursor-pointer relative group flex flex-col justify-between ${
                activeKpiFilter === 'LOW'
                  ? 'ring-2 ring-amber-500 bg-amber-500/[0.12] border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                  : lowStockCount > 0
                  ? 'bg-amber-500/[0.06] border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.12)] hover:border-amber-500/50'
                  : 'bg-[#1E293B]/60 border-white/8 border-t-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Reorder Alerts
                </span>
                <div className="relative">
                  {lowStockCount > 0 && (
                    <div className="absolute inset-0 rounded-xl bg-amber-500/40 blur-md animate-pulse" />
                  )}
                  <div
                    className={`relative h-8 w-8 rounded-xl flex items-center justify-center ${
                      lowStockCount > 0
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                        : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono tabular-nums">
                  <AnimatedCounter value={lowStockCount} />
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  {lowStockCount > 0 ? (
                    <span className="text-amber-400 font-medium">Needs purchase</span>
                  ) : (
                    <span className="text-emerald-400">All optimal</span>
                  )}
                  {activeKpiFilter === 'LOW' && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: BENTO HERO — Stock Health Radial Gauge + Sparkline (Spans 2 Columns) */}
            <div
              onClick={() => handleKpiCardClick('HEALTH')}
              className={`lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-[#1E293B]/90 via-[#1E293B]/60 to-[#0F172A]/80 backdrop-blur-xl border border-white/8 border-t-white/15 shadow-xl hover:border-emerald-500/40 transition-all cursor-pointer relative group flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden ${
                activeKpiFilter === 'HEALTH' ? 'ring-2 ring-emerald-500 bg-emerald-500/[0.08]' : ''
              }`}
            >
              {/* Radial Glow Layer */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Left Side: Stats & Info */}
              <div className="space-y-1 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Stock Health Index
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {healthyCount} of {products.length} Optimal
                  </span>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono tabular-nums">
                    <AnimatedCounter value={healthPercentage} suffix="%" />
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    fulfillment score
                  </span>
                </div>

                {/* Self-Drawing Animated Sparkline */}
                <div className="pt-2 h-6 w-44">
                  <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      d="M0,16 Q25,2 50,10 T100,4"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Right Side: Big Radial Gauge Ring (Animated) */}
              <div className="flex flex-col items-center justify-center shrink-0 z-10 pr-2">
                <div className="relative h-20 w-20 flex items-center justify-center">
                  <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 36 36">
                    <path
                      className="text-white/10"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      initial={{ strokeDasharray: '0, 100' }}
                      animate={{ strokeDasharray: `${healthPercentage}, 100` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className={`${
                        healthPercentage >= 75
                          ? 'text-emerald-400'
                          : healthPercentage >= 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono font-black text-sm text-white">
                    {healthPercentage}%
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1">
                  Health Ratio
                </span>
              </div>
            </div>
          </div>

          {/* 3. Filter Bar: Tabs + One Category + One Warehouse Select */}
          <div className="bg-[#1E293B]/70 border border-white/8 border-t-white/15 backdrop-blur-xl rounded-2xl p-3 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Tabs [All | Low Stock | Out of Stock] */}
            <div className="flex items-center bg-[#0F172A]/80 p-1 rounded-xl border border-white/5 text-xs font-medium">
              <button
                onClick={() => {
                  setActiveTab('ALL');
                  setActiveKpiFilter('NONE');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ALL'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>All Products</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'ALL' ? 'bg-slate-950/25 text-slate-950 font-bold' : 'bg-white/10 text-slate-300'
                }`}>
                  {totalProductsCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('LOW_STOCK');
                  setActiveKpiFilter('LOW');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'LOW_STOCK'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35 font-bold'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Low Stock</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/25 text-amber-200">
                  {lowStockCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('OUT_OF_STOCK');
                  setActiveKpiFilter('NONE');
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'OUT_OF_STOCK'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/35 font-bold'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span>Out of Stock</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/25 text-rose-200">
                  {outOfStockCount}
                </span>
              </button>
            </div>

            {/* Right: ONE Category Select + ONE Warehouse Select */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Select */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-44 h-9 pl-3 pr-7 bg-[#0F172A]/80 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none shadow-xs"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Warehouse Select */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full sm:w-44 h-9 pl-3 pr-7 bg-[#0F172A]/80 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none shadow-xs"
                >
                  <option value="all">All Warehouses ({warehouses.length})</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Reset Filters */}
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
                  className="h-9 px-3 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 4. Data Table: Category Gradient Icons, Min-Level Ticks, Row Hover Lift */}
          <div className="rounded-2xl border border-white/8 border-t-white/15 bg-[#1E293B]/60 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                    <th className="p-4 w-10 text-center" onClick={(e) => e.stopPropagation()}>
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
                    <th className="p-4">Product & SKU Code</th>
                    <th className="p-4 hidden md:table-cell">Category</th>
                    <th className="p-4">Stock vs Reorder Min</th>
                    <th className="p-4">Health Status</th>
                    <th className="p-4 text-right w-16">Actions</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-white/[0.06]">
                  {isLoading ? (
                    // Skeleton Rows
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4 text-center">
                          <div className="h-4 w-4 bg-white/10 rounded mx-auto" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/10 rounded-xl" />
                            <div className="space-y-1.5">
                              <div className="h-4 w-40 bg-white/10 rounded" />
                              <div className="h-3 w-24 bg-white/5 rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="h-5 w-24 bg-white/10 rounded-full" />
                        </td>
                        <td className="p-4">
                          <div className="h-4 w-32 bg-white/10 rounded" />
                        </td>
                        <td className="p-4">
                          <div className="h-6 w-24 bg-white/10 rounded-full" />
                        </td>
                        <td className="p-4 text-right">
                          <div className="h-7 w-8 bg-white/10 rounded-lg ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto p-4">
                          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
                            <Package className="h-7 w-7" />
                          </div>
                          <p className="text-sm text-slate-100 font-bold">
                            {searchQuery ||
                            selectedCategory !== 'all' ||
                            selectedWarehouse !== 'all' ||
                            activeTab !== 'ALL'
                              ? 'No products match your current filters.'
                              : 'Your catalog is currently empty.'}
                          </p>
                          <p className="text-xs text-slate-400 text-center leading-relaxed">
                            Start adding items to configure stock levels, safety thresholds, and warehouse allocation.
                          </p>
                          <div className="flex items-center gap-2.5 mt-2">
                            <button
                              onClick={handleSeedDemoData}
                              disabled={seeding}
                              className="px-4 py-2 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="h-4 w-4" />
                              <span>Seed Demo Items</span>
                            </button>
                            <button
                              onClick={() => {
                                setProductToEdit(null);
                                setIsPanelOpen(true);
                              }}
                              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="h-4 w-4 stroke-[3]" />
                              <span>Add First Product</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product, idx) => {
                      const isOutOfStock = product.totalQuantity === 0;
                      const isLow = product.totalQuantity <= product.reorderPoint;
                      const isSelected = selectedProductIds.includes(product.id);

                      // Progress percentage calculation
                      const maxRatio = Math.max(product.reorderPoint * 2, 10);
                      const progressPct = Math.min(
                        100,
                        Math.round((product.totalQuantity / maxRatio) * 100)
                      );
                      const minTickPos = Math.min(95, Math.round((product.reorderPoint / maxRatio) * 100));

                      return (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                          onClick={() => handleRowClick(product)}
                          className={`transition-all duration-150 cursor-pointer group hover:-translate-y-[1px] ${
                            isSelected
                              ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.12]'
                              : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          {/* Checkbox */}
                          <td
                            className="p-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelectProduct(product.id, e as any)}
                              className="rounded border-white/20 bg-[#0F172A] text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                          </td>

                          {/* Product & SKU Code (JetBrains Mono) */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Category-Specific Gradient Icon Square */}
                              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${getCategoryGradient(product.category?.name)}`}>
                                {getCategoryIcon(product.category?.name)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-100 text-xs group-hover:text-amber-300 transition-colors">
                                  {product.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="font-mono text-[11px] text-slate-400 bg-[#0F172A] px-1.5 py-0.5 rounded border border-white/10 group-hover:border-amber-500/30 transition-colors"
                                    title="SKU = Stock Keeping Unit (Unique barcode)"
                                  >
                                    {product.sku}
                                  </span>
                                  <button
                                    onClick={(e) => handleCopySku(product.sku, e)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-amber-400 transition-opacity cursor-pointer"
                                    title="Copy SKU code"
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

                          {/* Category Dot & Badge */}
                          <td className="p-4 hidden md:table-cell">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/10 text-slate-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                              <span>{product.category?.name || 'Unassigned'}</span>
                            </div>
                          </td>

                          {/* Gradient Stock Bar with Min Level Indicator Tick */}
                          <td className="p-4">
                            <div className="space-y-1.5 max-w-[160px]">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-black text-white font-mono">
                                  {product.totalQuantity}{' '}
                                  <span className="font-normal text-slate-400 text-[10px] font-sans">
                                    {product.unit}
                                  </span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  min {product.reorderPoint}
                                </span>
                              </div>
                              {/* Visual Progress Track with Min Safety Tick */}
                              <div className="relative w-full h-2 bg-white/10 rounded-full overflow-visible">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isOutOfStock
                                      ? 'bg-rose-500 w-full'
                                      : isLow
                                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-sm shadow-amber-500/40'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/40'
                                  }`}
                                  style={{
                                    width: isOutOfStock ? '100%' : `${Math.max(8, progressPct)}%`,
                                  }}
                                />
                                {/* Safety Min Tick Indicator */}
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-white/60 shadow-xs"
                                  style={{ left: `${minTickPos}%` }}
                                  title={`Safety minimum: ${product.reorderPoint} units`}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Semantic Status Badge */}
                          <td className="p-4">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                In Stock
                              </span>
                            )}
                          </td>

                          {/* Actions Dropdown */}
                          <td
                            className="p-4 text-right relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() =>
                                  setOpenDropdownId(
                                    openDropdownId === product.id ? null : product.id
                                  )
                                }
                                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {openDropdownId === product.id && (
                                <div className="absolute right-0 mt-1 w-40 bg-[#1E293B] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 text-xs space-y-1 backdrop-blur-xl animate-in zoom-in-95 duration-100">
                                  <button
                                    onClick={() => {
                                      handleRowClick(product);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                                  >
                                    <Package className="h-3.5 w-3.5 text-amber-400" />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setProductToEdit(product);
                                      setIsPanelOpen(true);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-sky-400" />
                                    <span>Edit Product</span>
                                  </button>
                                  <div className="my-1 border-t border-white/10" />
                                  <button
                                    onClick={() => {
                                      handleDelete(product.id, product.name);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete Item</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 5. Row-Click Product Detail Sheet Drawer from Right */}
        <ProductDetailSheet
          product={sheetProduct}
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onStockAdjusted={handleStockAdjusted}
          warehouses={warehouses}
        />

        {/* 6. Checkbox Selection Floating Bulk Bar at Bottom Center */}
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
              productToEdit ? 'Product updated successfully' : 'Product created successfully'
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

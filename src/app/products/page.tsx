"use client";

import React, { useState, useEffect, useTransition, useMemo, Fragment } from "react";
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
  ChevronDown,
  ChevronUp,
  Package,
  AlertTriangle,
  X,
  Boxes,
  Activity,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
  Bell,
  Cpu,
  Wrench,
  Box,
  HardHat,
  MoreHorizontal
} from "lucide-react";
import { OperationsShell } from "@/components/layout/operations-shell";
import { ProductFormSlideOver } from "@/components/products/product-form-slideover";

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

const DEMO_PRODUCTS = [
  { name: "Wireless Barcode Scanner Handheld", sku: "ELEC-SCN-001", categoryName: "Electronics", unit: "Units", reorderPoint: 5, initialStock: 18 },
  { name: "Industrial Label Printer Thermal", sku: "ELEC-PRN-002", categoryName: "Electronics", unit: "Units", reorderPoint: 3, initialStock: 2 },
  { name: "M8 Hex Bolts Grade 8.8 (100-pack)", sku: "FSTN-BLT-M8", categoryName: "Hardware", unit: "Boxes", reorderPoint: 25, initialStock: 60 },
  { name: "Heavy Duty Stainless Steel Hinges", sku: "FSTN-HNG-SS", categoryName: "Hardware", unit: "Pieces", reorderPoint: 40, initialStock: 0 },
  { name: "Aluminum Extrusion Profile 2020 (1m)", sku: "RAW-ALU-2020", categoryName: "Raw Materials", unit: "Pieces", reorderPoint: 50, initialStock: 110 },
  { name: "Corrugated Shipping Cartons (Large)", sku: "PKG-BOX-LRG", categoryName: "Packaging", unit: "Bundles", reorderPoint: 20, initialStock: 15 },
  { name: "Stretch Film Roll 500mm x 300m", sku: "PKG-FLM-500", categoryName: "Packaging", unit: "Rolls", reorderPoint: 15, initialStock: 42 },
  { name: "Kevlar Cut-Resistant Work Gloves (L)", sku: "PPE-GLV-002", categoryName: "Safety Gear", unit: "Pairs", reorderPoint: 12, initialStock: 35 },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Slide-over panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.set("categoryId", selectedCategory);
      if (lowStockOnly) params.set("lowStock", "true");

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchProducts();
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, lowStockOnly]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("catalog-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from your catalog?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setSelectedProductIds((prev) => prev.filter((item) => item !== id));
      } else {
        alert(json.message || "Failed to delete product");
      }
    } catch (err) {
      alert("An error occurred while deleting the product");
    }
  };

  const handleCopySku = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      for (const item of DEMO_PRODUCTS) {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      await fetchProducts();
      await fetchCategories();
    } catch (err) {
      console.error("Failed to seed demo products:", err);
    } finally {
      setSeeding(false);
    }
  };

  const handleExportCSV = (specificItems?: Product[]) => {
    const exportList = specificItems || products;
    if (exportList.length === 0) return;
    const headers = ["SKU / Code", "Product Name", "Category", "Unit", "Current Stock", "Min Reorder Point", "Health Status"];
    const rows = exportList.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category?.name || "Uncategorized",
      p.unit,
      p.totalQuantity,
      p.reorderPoint,
      p.totalQuantity === 0 ? "Out of Stock" : p.isLowStock ? "Low Stock" : "In Stock",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stocksense-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProductIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Metrics
  const lowStockCount = useMemo(() => products.filter((p) => p.isLowStock).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.totalQuantity === 0).length, [products]);
  const totalStockUnits = useMemo(() => products.reduce((sum, p) => sum + (p.totalQuantity || 0), 0), [products]);
  const healthyCount = useMemo(() => products.filter((p) => !p.isLowStock && p.totalQuantity > 0).length, [products]);
  const healthPercentage = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.round((healthyCount / products.length) * 100);
  }, [products, healthyCount]);

  const getCategoryIcon = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("elec")) return <Cpu className="h-4 w-4 text-sky-400" />;
    if (name.includes("hard") || name.includes("fast")) return <Wrench className="h-4 w-4 text-amber-400" />;
    if (name.includes("pack")) return <Box className="h-4 w-4 text-slate-400" />;
    if (name.includes("safe") || name.includes("ppe")) return <HardHat className="h-4 w-4 text-emerald-400" />;
    return <Layers className="h-4 w-4 text-indigo-400" />;
  };

  const getCategoryBadgeClass = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("elec")) return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    if (name.includes("hard") || name.includes("fast")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (name.includes("pack")) return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    if (name.includes("safe") || name.includes("ppe")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
  };

  return (
    <OperationsShell>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D1117] text-[#F0F6FC] relative">
        {/* Top Header & Search Bar */}
        <header className="h-16 px-4 md:px-8 border-b border-white/[0.08] flex items-center justify-between bg-[#090C10]/80 backdrop-blur-md shrink-0 gap-4">
          {/* Universal Search (Cmd+K) */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="catalog-search"
              type="text"
              placeholder="Search products, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9.5 pl-10 pr-12 text-xs bg-[#161B22] border border-white/[0.08] rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
            />
            <span className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] rounded">
              ⌘K
            </span>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="h-9 w-9 relative rounded-lg border border-white/[0.08] bg-[#161B22] hover:bg-white/[0.04] text-slate-400 hover:text-white flex items-center justify-center transition-colors">
              <Bell className="h-4 w-4" />
              {lowStockCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#161B22]" />
              )}
            </button>

            {/* Quick Refresh */}
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="h-9 w-9 rounded-lg border border-white/[0.08] bg-[#161B22] hover:bg-white/[0.04] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Refresh inventory"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {/* Page Title & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
                Products & Inventory
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Manage your master catalog, track live warehouse stock, and monitor reorder levels.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Seed Demo Button */}
              {products.length < 5 && (
                <button
                  onClick={handleSeedDemoData}
                  disabled={seeding}
                  className="h-9 px-3.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${seeding ? "animate-spin" : ""}`} />
                  <span>{seeding ? "Loading..." : "⚡ Demo Items"}</span>
                </button>
              )}

              {/* Export CSV */}
              <button
                onClick={() => handleExportCSV()}
                disabled={products.length === 0}
                className="h-9 px-3.5 text-xs font-medium text-slate-300 hover:text-white bg-[#161B22] hover:bg-[#1F242C] border border-white/[0.08] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>

              {/* Add Product Primary CTA */}
              <button
                onClick={() => {
                  setProductToEdit(null);
                  setIsPanelOpen(true);
                }}
                className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* 4 High-Impact Elevated KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total SKUs */}
            <div className="p-4 rounded-xl bg-[#161B22] border border-white/[0.08] shadow-sm hover:border-white/[0.12] transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Total SKUs</span>
                <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {products.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="text-emerald-400 font-medium">Active</span>
                <span>catalog products</span>
              </div>
            </div>

            {/* KPI 2: Total Inventory */}
            <div className="p-4 rounded-xl bg-[#161B22] border border-white/[0.08] shadow-sm hover:border-white/[0.12] transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Total Inventory</span>
                <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {totalStockUnits} <span className="text-xs font-normal text-slate-400">Units</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {outOfStockCount > 0 ? (
                  <span className="text-amber-400">{outOfStockCount} items need restock</span>
                ) : (
                  <span className="text-emerald-400">Stock distributed in DC</span>
                )}
              </div>
            </div>

            {/* KPI 3: Stock Health Score */}
            <div className="p-4 rounded-xl bg-[#161B22] border border-white/[0.08] shadow-sm hover:border-white/[0.12] transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Stock Health</span>
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${
                  healthPercentage >= 75 ? "text-emerald-400" : healthPercentage >= 40 ? "text-amber-400" : "text-red-400"
                }`}>
                  {healthPercentage}%
                </span>
                <span className="text-[11px] text-slate-400">
                  ({healthyCount}/{products.length} healthy)
                </span>
              </div>
              {/* Mini Health Bar */}
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    healthPercentage >= 75 ? "bg-emerald-500" : healthPercentage >= 40 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
            </div>

            {/* KPI 4: Attention Needed */}
            <div className={`p-4 rounded-xl border shadow-sm transition-colors ${
              lowStockCount > 0 
                ? "bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/30" 
                : "bg-[#161B22] border-white/[0.08]"
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Attention Needed</span>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                  lowStockCount > 0 ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {lowStockCount} <span className="text-xs font-normal text-slate-400">Reorders</span>
              </div>
              <div className="mt-1">
                {lowStockCount > 0 ? (
                  <button
                    onClick={() => setLowStockOnly(true)}
                    className="text-[11px] font-medium text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View alerts</span>
                    <span>→</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-medium">All levels optimal</span>
                )}
              </div>
            </div>
          </div>

          {/* Filter Pills Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setLowStockOnly(false);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "all" && !lowStockOnly
                    ? "bg-white text-slate-900 shadow-sm"
                    : "bg-[#161B22] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]"
                }`}
              >
                <span>All Products</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === "all" && !lowStockOnly
                    ? "bg-slate-200 text-slate-900"
                    : "bg-white/[0.06] text-slate-400"
                }`}>
                  {products.length}
                </span>
              </button>

              {lowStockCount > 0 && (
                <button
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    lowStockOnly
                      ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                      : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Low Stock Alerts</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950/40 text-amber-200">
                    {lowStockCount}
                  </span>
                </button>
              )}

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setLowStockOnly(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id && !lowStockOnly
                      ? "bg-white text-slate-900 shadow-sm"
                      : "bg-[#161B22] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat._count?.products !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedCategory === cat.id && !lowStockOnly
                        ? "bg-slate-200 text-slate-900"
                        : "bg-white/[0.06] text-slate-400"
                    }`}>
                      {cat._count.products}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="font-medium text-white">{products.length}</span> items
            </div>
          </div>

          {/* Modern Enterprise Data Table */}
          <div className="rounded-xl border border-white/[0.08] bg-[#161B22] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* Table Head */}
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 text-xs font-medium">
                    <th className="px-4 py-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedProductIds.length === products.length}
                        onChange={toggleSelectAll}
                        className="rounded border-white/[0.2] bg-[#0D1117] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5">Product & SKU</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">Category</th>
                    <th className="px-4 py-3.5">Stock vs Minimum</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right w-24">Actions</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-white/[0.06] text-sm">
                  {loading && products.length === 0 ? (
                    // Skeleton Shimmer Loading Rows
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4 text-center">
                          <div className="h-4 w-4 bg-white/[0.06] rounded mx-auto" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/[0.06] rounded-lg" />
                            <div className="space-y-2">
                              <div className="h-4 w-40 bg-white/[0.06] rounded" />
                              <div className="h-3 w-20 bg-white/[0.04] rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <div className="h-6 w-24 bg-white/[0.06] rounded-full" />
                        </td>
                        <td className="p-4">
                          <div className="h-4 w-28 bg-white/[0.06] rounded" />
                        </td>
                        <td className="p-4">
                          <div className="h-6 w-20 bg-white/[0.06] rounded-full" />
                        </td>
                        <td className="p-4 text-right">
                          <div className="h-8 w-16 bg-white/[0.06] rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto p-4">
                          <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400">
                            <Package className="h-6 w-6" />
                          </div>
                          <p className="text-sm text-slate-200 font-medium">
                            {searchQuery || selectedCategory !== "all" || lowStockOnly
                              ? "No products match your current filters."
                              : "No inventory products registered yet."}
                          </p>
                          <p className="text-xs text-slate-400 text-center">
                            Start adding items to configure stock levels, safety thresholds, and warehouse allocation.
                          </p>
                          <div className="flex items-center gap-2.5 mt-2">
                            <button
                              onClick={handleSeedDemoData}
                              disabled={seeding}
                              className="px-3.5 py-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Seed Demo Items
                            </button>
                            <button
                              onClick={() => {
                                setProductToEdit(null);
                                setIsPanelOpen(true);
                              }}
                              className="px-3.5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Product
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const isOutOfStock = product.totalQuantity === 0;
                      const isLow = product.totalQuantity <= product.reorderPoint;
                      const isExpanded = expandedProductId === product.id;
                      const isSelected = selectedProductIds.includes(product.id);

                      // Stock vs reorder ratio for progress indicator
                      const stockPercentage = product.reorderPoint > 0 
                        ? Math.min(100, Math.round((product.totalQuantity / (product.reorderPoint * 2)) * 100))
                        : 100;

                      return (
                        <Fragment key={product.id}>
                          <tr
                            onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                            className={`transition-all duration-150 cursor-pointer group ${
                              isSelected 
                                ? "bg-indigo-950/20" 
                                : isExpanded 
                                ? "bg-white/[0.04]" 
                                : "hover:bg-white/[0.02]"
                            }`}
                          >
                            {/* Row Checkbox */}
                            <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => toggleSelectProduct(product.id, e as any)}
                                className="rounded border-white/[0.2] bg-[#0D1117] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>

                            {/* Product & SKU Column */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                {/* 40x40 Thumbnail / Category Placeholder */}
                                <div className="h-10 w-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 shadow-inner group-hover:border-white/[0.12] transition-colors">
                                  {getCategoryIcon(product.category?.name)}
                                </div>

                                <div>
                                  <div className="font-medium text-slate-100 text-sm group-hover:text-indigo-300 transition-colors">
                                    {product.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-[11px] text-slate-400 bg-[#0D1117] px-1.5 py-0.5 rounded border border-white/[0.06]">
                                      {product.sku}
                                    </span>
                                    <button
                                      onClick={(e) => handleCopySku(product.sku, e)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-white transition-opacity"
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

                            {/* Category Tag Pill */}
                            <td className="px-4 py-3.5 hidden sm:table-cell">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryBadgeClass(product.category?.name)}`}>
                                {product.category?.name || "Unassigned"}
                              </span>
                            </td>

                            {/* Stock vs Min Level Column */}
                            <td className="px-4 py-3.5">
                              <div className="space-y-1 max-w-[140px]">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-white">
                                    {product.totalQuantity} <span className="font-normal text-slate-400">{product.unit}</span>
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    min {product.reorderPoint}
                                  </span>
                                </div>
                                {/* Visual Stock Bar */}
                                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isOutOfStock 
                                        ? "bg-red-500 w-full" 
                                        : isLow 
                                        ? "bg-amber-500" 
                                        : "bg-emerald-500"
                                    }`}
                                    style={{ width: isOutOfStock ? "100%" : `${Math.max(8, stockPercentage)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="px-4 py-3.5">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                                  Out of Stock
                                </span>
                              ) : isLow ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                  In Stock
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setProductToEdit(product);
                                    setIsPanelOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id, product.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                                  title="Inspect details"
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Detail Panel */}
                          {isExpanded && (
                            <tr className="bg-[#12151C] border-b border-white/[0.08]">
                              <td colSpan={6} className="p-4 px-6">
                                <div className="rounded-lg bg-[#161B22] border border-white/[0.08] p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                  {/* Item Metadata */}
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                      Product Details
                                    </div>
                                    <div className="font-semibold text-white text-sm">
                                      {product.name}
                                    </div>
                                    <div className="text-slate-400 font-mono">
                                      SKU: <span className="text-indigo-400">{product.sku}</span>
                                    </div>
                                    <div className="text-slate-400">
                                      Unit: {product.unit} • Category: {product.category?.name || "Unassigned"}
                                    </div>
                                  </div>

                                  {/* Storage breakdown */}
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                      Warehouse Distribution
                                    </div>
                                    {product.levels && product.levels.length > 0 ? (
                                      <div className="space-y-1">
                                        {product.levels.map((lvl) => (
                                          <div key={lvl.id} className="flex items-center justify-between text-slate-300">
                                            <span>{lvl.warehouse?.name || "Main Distribution Center"}:</span>
                                            <span className="font-bold text-white">{lvl.quantity} {product.unit}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-slate-500">
                                        No storage records. Stock increments automatically when Receipts are processed.
                                      </div>
                                    )}
                                  </div>

                                  {/* Reorder Diagnostic */}
                                  <div className="space-y-1.5 flex flex-col justify-between">
                                    <div>
                                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                        Safety Threshold
                                      </div>
                                      <div className="text-slate-300 mt-1">
                                        Minimum Threshold: <span className="font-semibold text-white">{product.reorderPoint} {product.unit}</span>
                                      </div>
                                      <div className="text-slate-400 mt-0.5">
                                        {product.totalQuantity <= product.reorderPoint
                                          ? "⚠️ Stock is at or below threshold. Reorder advised."
                                          : "✓ Current inventory levels meet safety margins."}
                                      </div>
                                    </div>

                                    <div>
                                      <button
                                        onClick={() => {
                                          setProductToEdit(product);
                                          setIsPanelOpen(true);
                                        }}
                                        className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline text-xs"
                                      >
                                        Edit product parameters →
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Floating Bulk Action Toolbar Dock */}
        {selectedProductIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#161B22]/95 backdrop-blur-md border border-white/[0.12] rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 text-xs">
            <div className="font-medium text-white flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>{selectedProductIds.length} item{selectedProductIds.length > 1 ? "s" : ""} selected</span>
            </div>

            <div className="h-4 w-px bg-white/[0.12]" />

            <button
              onClick={() => {
                const selectedItems = products.filter((p) => selectedProductIds.includes(p.id));
                handleExportCSV(selectedItems);
              }}
              className="font-medium text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Selected</span>
            </button>

            <button
              onClick={() => setSelectedProductIds([])}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        )}

        {/* Slide-over Create / Edit Panel */}
        <ProductFormSlideOver
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          productToEdit={productToEdit}
          categories={categories}
          onSuccess={() => {
            fetchProducts();
            fetchCategories();
          }}
          onCategoryCreated={(newCat) => {
            setCategories((prev) => [...prev, newCat]);
          }}
        />
      </div>
    </OperationsShell>
  );
}

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
  Activity,
  Layers,
  Cpu,
  Wrench,
  Box,
  HardHat
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
    if (name.includes("elec")) return <Cpu className="h-4 w-4 text-[#ffc174]" />;
    if (name.includes("hard") || name.includes("fast")) return <Wrench className="h-4 w-4 text-teal-400" />;
    if (name.includes("pack")) return <Box className="h-4 w-4 text-[#94a3b8]" />;
    if (name.includes("safe") || name.includes("ppe")) return <HardHat className="h-4 w-4 text-[#ffd49d]" />;
    return <Layers className="h-4 w-4 text-[#ffc174]" />;
  };

  const getCategoryBadgeClass = (categoryName?: string) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("elec")) return "bg-[#ffc174]/10 text-[#ffd49d] border-[#ffc174]/20";
    if (name.includes("hard") || name.includes("fast")) return "bg-teal-500/10 text-teal-300 border-teal-500/20";
    if (name.includes("pack")) return "bg-[#2d3449]/30 text-[#b4c6d4] border-[#2d3449]/50";
    if (name.includes("safe") || name.includes("ppe")) return "bg-[#ffc174]/10 text-[#ffc174] border-[#ffc174]/20";
    return "bg-[#ffc174]/10 text-[#ffd49d] border-[#ffc174]/20";
  };

  return (
    <OperationsShell>
      <div className="flex-1 flex flex-col h-full bg-[#0b1326] text-[#dae2fd]">
        {/* Main Content Area */}
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 w-full">
          {/* Page Title & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#dae2fd] tracking-tight">
                Products & Inventory
              </h1>
              <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
                Manage your master catalog, track live warehouse stock, and monitor reorder levels.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Seed Demo Button */}
              {products.length < 5 && (
                <button
                  onClick={handleSeedDemoData}
                  disabled={seeding}
                  className="h-9 px-3.5 text-xs font-medium text-[#ffc174] bg-[#ffc174]/10 hover:bg-[#ffc174]/15 border border-[#ffc174]/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${seeding ? "animate-spin" : ""}`} />
                  <span>{seeding ? "Loading..." : "⚡ Demo Items"}</span>
                </button>
              )}

              {/* Export CSV */}
              <button
                onClick={() => handleExportCSV()}
                disabled={products.length === 0}
                className="h-9 px-3.5 text-xs font-medium text-[#b4c6d4] hover:text-[#dae2fd] bg-[#131b2e] hover:bg-[#171f33] border border-[#2d3449]/70 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-[#94a3b8]" />
                <span>Export CSV</span>
              </button>

              {/* Add Product Primary CTA */}
              <button
                onClick={() => {
                  setProductToEdit(null);
                  setIsPanelOpen(true);
                }}
                className="h-9 px-4 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-lg shadow-sm shadow-[#ffc174]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* 4 High-Impact Elevated KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total SKUs */}
            <div className="p-4 rounded-xl bg-[#131b2e] border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition-colors">
              <div className="flex items-center justify-between text-[#94a3b8] mb-2">
                <span className="text-xs font-medium">Total SKUs</span>
                <div className="h-7 w-7 rounded-lg bg-[#ffc174]/10 border border-[#ffc174]/20 flex items-center justify-center text-[#ffc174]">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#dae2fd] tracking-tight">
                {products.length}
              </div>
              <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center gap-1">
                <span className="text-[#ffc174] font-medium">Active</span>
                <span>catalog products</span>
              </div>
            </div>

            {/* KPI 2: Total Inventory */}
            <div className="p-4 rounded-xl bg-[#131b2e] border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition-colors">
              <div className="flex items-center justify-between text-[#94a3b8] mb-2">
                <span className="text-xs font-medium">Total Inventory</span>
                <div className="h-7 w-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#dae2fd] tracking-tight">
                {totalStockUnits} <span className="text-xs font-normal text-[#94a3b8]">Units</span>
              </div>
              <div className="text-[11px] text-[#94a3b8] mt-1">
                {outOfStockCount > 0 ? (
                  <span className="text-amber-400">{outOfStockCount} items need restock</span>
                ) : (
                  <span className="text-[#ffc174]">Stock distributed in DC</span>
                )}
              </div>
            </div>

            {/* KPI 3: Stock Health Score */}
            <div className="p-4 rounded-xl bg-[#131b2e] border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition-colors">
              <div className="flex items-center justify-between text-[#94a3b8] mb-2">
                <span className="text-xs font-medium">Stock Health</span>
                <div className="h-7 w-7 rounded-lg bg-[#ffc174]/10 border border-[#ffc174]/20 flex items-center justify-center text-[#ffc174]">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${
                  healthPercentage >= 75 ? "text-[#ffc174]" : healthPercentage >= 40 ? "text-amber-400" : "text-red-400"
                }`}>
                  {healthPercentage}%
                </span>
                <span className="text-[11px] text-[#94a3b8]">
                  ({healthyCount}/{products.length} healthy)
                </span>
              </div>
              {/* Mini Health Bar */}
              <div className="w-full h-1.5 bg-[#2d3449]/40 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    healthPercentage >= 75 ? "bg-[#ffc174]" : healthPercentage >= 40 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
            </div>

            {/* KPI 4: Attention Needed */}
            <div className={`p-4 rounded-xl border shadow-sm transition-colors ${
              lowStockCount > 0 
                ? "bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/30" 
                : "bg-[#131b2e] border-[#2d3449]/70"
            }`}>
              <div className="flex items-center justify-between text-[#94a3b8] mb-2">
                <span className="text-xs font-medium">Attention Needed</span>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                  lowStockCount > 0 ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-[#ffc174]/10 border border-[#ffc174]/20 text-[#ffc174]"
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#dae2fd] tracking-tight">
                {lowStockCount} <span className="text-xs font-normal text-[#94a3b8]">Reorders</span>
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
                  <span className="text-[11px] text-[#ffc174] font-medium">All levels optimal</span>
                )}
              </div>
            </div>
          </div>

          {/* Search Toolbar & Filter Pills */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                id="catalog-search"
                type="text"
                placeholder="Search products, SKU, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9.5 pr-8 text-xs bg-[#131b2e] border border-[#2d3449]/70 rounded-lg text-[#dae2fd] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#ffc174]/20 focus:border-[#ffc174] transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#dae2fd]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setLowStockOnly(false);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === "all" && !lowStockOnly
                    ? "bg-[#ffc174] text-[#090D16] shadow-sm font-semibold"
                    : "bg-[#131b2e] text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#222a3d] border border-[#2d3449]/50"
                }`}
              >
                <span>All</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === "all" && !lowStockOnly
                    ? "bg-[#222a3d] text-[#dae2fd]"
                    : "bg-[#2d3449]/40 text-[#94a3b8]"
                }`}>
                  {products.length}
                </span>
              </button>

              {lowStockCount > 0 && (
                <button
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    lowStockOnly
                      ? "bg-[#ffc174] text-[#090D16] font-semibold shadow-sm"
                      : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Low Stock</span>
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
                      ? "bg-[#ffc174] text-[#090D16] shadow-sm font-semibold"
                      : "bg-[#131b2e] text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#222a3d] border border-[#2d3449]/50"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat._count?.products !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedCategory === cat.id && !lowStockOnly
                        ? "bg-[#222a3d] text-[#dae2fd]"
                        : "bg-[#2d3449]/40 text-[#94a3b8]"
                    }`}>
                      {cat._count.products}
                    </span>
                  )}
                </button>
              ))}

              {/* Refresh Button */}
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="h-8 w-8 rounded-lg border border-[#2d3449]/70 bg-[#131b2e] hover:bg-[#171f33] text-[#94a3b8] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
                title="Refresh inventory"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#ffc174]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Modern Enterprise Data Table */}
          <div className="rounded-xl border border-[#2d3449]/70 bg-[#131b2e] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* Table Head */}
                <thead>
                  <tr className="border-b border-[#2d3449]/70 bg-[#131b2e]/60 text-[#94a3b8] text-xs font-medium">
                    <th className="px-4 py-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedProductIds.length === products.length}
                        onChange={toggleSelectAll}
                        className="rounded border-[#2d3449] bg-[#0b1326] text-[#f59e0b] focus:ring-[#ffc174] cursor-pointer"
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
                <tbody className="divide-y divide-[#2d3449]/50 text-sm">
                  {loading && products.length === 0 ? (
                    // Skeleton Shimmer Loading Rows
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4 text-center">
                          <div className="h-4 w-4 bg-[#2d3449]/40 rounded mx-auto" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-[#2d3449]/40 rounded-lg" />
                            <div className="space-y-2">
                              <div className="h-4 w-40 bg-[#2d3449]/40 rounded" />
                              <div className="h-3 w-20 bg-[#131b2e] rounded" />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <div className="h-6 w-24 bg-[#2d3449]/40 rounded-full" />
                        </td>
                        <td className="p-4">
                          <div className="h-4 w-28 bg-[#2d3449]/40 rounded" />
                        </td>
                        <td className="p-4">
                          <div className="h-6 w-20 bg-[#2d3449]/40 rounded-full" />
                        </td>
                        <td className="p-4 text-right">
                          <div className="h-8 w-16 bg-[#2d3449]/40 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-[#94a3b8]">
                        <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto p-4">
                          <div className="h-12 w-12 rounded-2xl bg-[#131b2e] border border-[#2d3449]/70 flex items-center justify-center text-[#94a3b8]">
                            <Package className="h-6 w-6" />
                          </div>
                          <p className="text-sm text-[#dae2fd] font-medium">
                            {searchQuery || selectedCategory !== "all" || lowStockOnly
                              ? "No products match your current filters."
                              : "No inventory products registered yet."}
                          </p>
                          <p className="text-xs text-[#94a3b8] text-center">
                            Start adding items to configure stock levels, safety thresholds, and warehouse allocation.
                          </p>
                          <div className="flex items-center gap-2.5 mt-2">
                            <button
                              onClick={handleSeedDemoData}
                              disabled={seeding}
                              className="px-3.5 py-2 text-xs font-medium text-[#ffc174] bg-[#ffc174]/10 hover:bg-[#ffc174]/15 border border-[#ffc174]/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Seed Demo Items
                            </button>
                            <button
                              onClick={() => {
                                setProductToEdit(null);
                                setIsPanelOpen(true);
                              }}
                              className="px-3.5 py-2 text-xs font-medium bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
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
                                ? "bg-[#ffc174]/10" 
                                : isExpanded 
                                ? "bg-[#131b2e]" 
                                : "hover:bg-[#171f33]/60"
                            }`}
                          >
                            {/* Row Checkbox */}
                            <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => toggleSelectProduct(product.id, e as any)}
                                className="rounded border-[#2d3449] bg-[#0b1326] text-[#f59e0b] focus:ring-[#ffc174] cursor-pointer"
                              />
                            </td>

                            {/* Product & SKU Column */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                {/* 40x40 Thumbnail / Category Placeholder */}
                                <div className="h-10 w-10 rounded-lg bg-[#131b2e] border border-[#2d3449]/50 flex items-center justify-center shrink-0 shadow-inner group-hover:border-[#2d3449] transition-colors">
                                  {getCategoryIcon(product.category?.name)}
                                </div>

                                <div>
                                  <div className="font-medium text-[#dae2fd] text-sm group-hover:text-[#ffd49d] transition-colors">
                                    {product.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-[11px] text-[#94a3b8] bg-[#0b1326] px-1.5 py-0.5 rounded border border-[#2d3449]/50">
                                      {product.sku}
                                    </span>
                                    <button
                                      onClick={(e) => handleCopySku(product.sku, e)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#94a3b8] hover:text-[#dae2fd] transition-opacity"
                                      title="Copy SKU code"
                                    >
                                      {copiedSku === product.sku ? (
                                        <Check className="h-3 w-3 text-[#ffc174]" />
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
                                  <span className="font-semibold text-[#dae2fd]">
                                    {product.totalQuantity} <span className="font-normal text-[#94a3b8]">{product.unit}</span>
                                  </span>
                                  <span className="text-[11px] text-[#94a3b8]">
                                    min {product.reorderPoint}
                                  </span>
                                </div>
                                {/* Visual Stock Bar */}
                                <div className="w-full h-1.5 bg-[#2d3449]/40 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isOutOfStock 
                                        ? "bg-red-500 w-full" 
                                        : isLow 
                                        ? "bg-amber-500" 
                                        : "bg-[#ffc174]"
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#ffc174]/10 text-[#ffc174] border border-[#ffc174]/20">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#ffc174]" />
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
                                  className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#222a3d] transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id, product.name)}
                                  className="p-1.5 rounded-lg text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                                  className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#222a3d] transition-colors"
                                  title="Inspect details"
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Detail Panel */}
                          {isExpanded && (
                            <tr className="bg-[#12151C] border-b border-[#2d3449]/70">
                              <td colSpan={6} className="p-4 px-6">
                                <div className="rounded-lg bg-[#131b2e] border border-[#2d3449]/70 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                  {/* Item Metadata */}
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
                                      Product Details
                                    </div>
                                    <div className="font-semibold text-[#dae2fd] text-sm">
                                      {product.name}
                                    </div>
                                    <div className="text-[#94a3b8] font-mono">
                                      SKU: <span className="text-[#ffc174]">{product.sku}</span>
                                    </div>
                                    <div className="text-[#94a3b8]">
                                      Unit: {product.unit} • Category: {product.category?.name || "Unassigned"}
                                    </div>
                                  </div>

                                  {/* Storage breakdown */}
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
                                      Warehouse Distribution
                                    </div>
                                    {product.levels && product.levels.length > 0 ? (
                                      <div className="space-y-1">
                                        {product.levels.map((lvl) => (
                                          <div key={lvl.id} className="flex items-center justify-between text-[#b4c6d4]">
                                            <span>{lvl.warehouse?.name || "Main Distribution Center"}:</span>
                                            <span className="font-bold text-[#dae2fd]">{lvl.quantity} {product.unit}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-[#94a3b8]">
                                        No storage records. Stock increments automatically when Receipts are processed.
                                      </div>
                                    )}
                                  </div>

                                  {/* Reorder Diagnostic */}
                                  <div className="space-y-1.5 flex flex-col justify-between">
                                    <div>
                                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
                                        Safety Threshold
                                      </div>
                                      <div className="text-[#b4c6d4] mt-1">
                                        Minimum Threshold: <span className="font-semibold text-[#dae2fd]">{product.reorderPoint} {product.unit}</span>
                                      </div>
                                      <div className="text-[#94a3b8] mt-0.5">
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
                                        className="text-[#ffc174] hover:text-[#ffd49d] font-medium hover:underline text-xs cursor-pointer"
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
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#131b2e]/95 backdrop-blur-md border border-[#2d3449]/60 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 text-xs">
            <div className="font-medium text-[#dae2fd] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ffc174]" />
              <span>{selectedProductIds.length} item{selectedProductIds.length > 1 ? "s" : ""} selected</span>
            </div>

            <div className="h-4 w-px bg-[#2d3449]" />

            <button
              onClick={() => {
                const selectedItems = products.filter((p) => selectedProductIds.includes(p.id));
                handleExportCSV(selectedItems);
              }}
              className="font-medium text-[#b4c6d4] hover:text-[#dae2fd] flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Selected</span>
            </button>

            <button
              onClick={() => setSelectedProductIds([])}
              className="text-[#94a3b8] hover:text-[#dae2fd] text-xs cursor-pointer"
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

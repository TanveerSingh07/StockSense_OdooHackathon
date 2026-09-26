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
  X
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
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
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

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ["SKU / Code", "Product Name", "Category", "Unit", "Current Stock", "Min Reorder Point", "Health Status"];
    const rows = products.map((p) => [
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

  // Metrics
  const lowStockCount = useMemo(() => products.filter((p) => p.isLowStock).length, [products]);
  const totalStockUnits = useMemo(() => products.reduce((sum, p) => sum + (p.totalQuantity || 0), 0), [products]);
  const healthPercentage = useMemo(() => {
    if (products.length === 0) return 0;
    const healthyCount = products.filter((p) => !p.isLowStock && p.totalQuantity > 0).length;
    return Math.round((healthyCount / products.length) * 100);
  }, [products]);

  // Health Color logic: Red when low, yellow when medium, green when healthy
  const healthColorClass = healthPercentage >= 75
    ? "text-[#5C9A63]"
    : healthPercentage >= 40
    ? "text-[#F2B705]"
    : "text-[#D2482F]";

  return (
    <OperationsShell>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent text-[#EDEAE3] relative z-10">
        {/* Top Header Bar */}
        <header className="px-4 md:px-6 py-3.5 border-b border-[#3A3733] flex flex-col sm:flex-row sm:items-center justify-between bg-[#242320]/90 backdrop-blur-md gap-3 shrink-0">
          <div>
            <h1 className="text-[22px] md:text-[26px] font-sans font-bold text-[#EDEAE3] tracking-tight">
              Product Inventory
            </h1>
            <p className="text-xs text-[#938E83] hidden sm:block">
              Manage your product catalog, warehouse stock levels, and reorder warnings.
            </p>
          </div>

          {/* Quick Action Suite */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#938E83]" />
              <input
                id="catalog-search"
                type="text"
                placeholder="Search products or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 text-[13.5px] bg-[#1C1B18] border border-[#3A3733] rounded-[2px] text-[#EDEAE3] placeholder-[#938E83]/50 focus:border-[#F2B705] focus:outline-none focus:ring-0 transition-colors"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#938E83] hover:text-[#EDEAE3]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#938E83]/40 border border-[#3A3733] px-1 rounded-[2px]">
                  /
                </span>
              )}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={products.length === 0}
              className="h-9 px-3 text-xs font-mono text-[#938E83] hover:text-[#EDEAE3] bg-[#242320] hover:bg-[#2D2B27] border border-[#3A3733] rounded-[2px] transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#F2B705] disabled:opacity-40 cursor-pointer"
              title="Download Inventory Spreadsheet"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span> CSV
            </button>

            {/* Seed Demo Products Button */}
            {products.length < 5 && (
              <button
                onClick={handleSeedDemoData}
                disabled={seeding}
                className="h-9 px-3.5 text-xs font-semibold text-[#5C9A63] bg-[#242320] hover:bg-[#2D2B27] border border-[#3A3733] rounded-[2px] transition-all flex items-center gap-1.5 cursor-pointer"
                title="Populate demo products with realistic stock levels"
              >
                <Sparkles className={`h-3.5 w-3.5 ${seeding ? "animate-spin" : ""}`} />
                <span>{seeding ? "Loading..." : "⚡ Demo Items"}</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="h-9 w-9 flex items-center justify-center rounded-[2px] border border-[#3A3733] bg-[#242320] text-[#938E83] hover:text-[#EDEAE3] transition-colors focus-visible:outline-2 focus-visible:outline-[#F2B705] cursor-pointer"
              title="Refresh inventory"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Primary Add Product Button */}
            <button
              onClick={() => {
                setProductToEdit(null);
                setIsPanelOpen(true);
              }}
              className="h-9 px-3.5 md:px-4 text-[13px] md:text-[13.5px] font-bold bg-[#F2B705] text-[#1C1B18] hover:bg-[#deb005] active:scale-[0.98] transition-all duration-100 rounded-[2px] flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-white select-none cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
          </div>
        </header>

        {/* Horizontal Stat Strip (Clean, single bar) */}
        <div className="px-4 md:px-6 py-2.5 border-b border-[#3A3733] bg-[#242320] flex flex-wrap items-center text-[13px] font-mono select-none gap-y-1">
          <div className="pr-4 md:pr-6 flex items-center gap-2">
            <span className="font-bold text-[#EDEAE3]">{products.length}</span>
            <span className="text-[#938E83]">Total Items</span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-[#3A3733]" />

          <div className="px-4 md:px-6 flex items-center gap-2">
            <span className="font-bold text-[#EDEAE3]">{totalStockUnits}</span>
            <span className="text-[#938E83]">Units in Stock</span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-[#3A3733]" />

          <div className="px-4 md:px-6 flex items-center gap-2">
            <span className={`font-bold ${healthColorClass}`}>{healthPercentage}%</span>
            <span className="text-[#938E83]">Healthy Stock</span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-[#3A3733]" />

          <div className="pl-4 md:pl-6 flex items-center gap-2">
            <span className={`font-bold ${lowStockCount > 0 ? "text-[#F2B705]" : "text-[#5C9A63]"}`}>
              {lowStockCount}
            </span>
            <span className="text-[#938E83]">Low Stock Alerts</span>
          </div>
        </div>

        {/* Category Tabs (Underlined table-of-contents style) */}
        <div className="px-4 md:px-6 border-b border-[#3A3733] bg-[#242320]/60 flex items-center gap-6 md:gap-8 overflow-x-auto select-none text-[13px]">
          <button
            onClick={() => {
              setSelectedCategory("all");
              setLowStockOnly(false);
            }}
            className={`py-2.5 font-medium transition-colors relative cursor-pointer shrink-0 ${
              selectedCategory === "all" && !lowStockOnly
                ? "text-[#EDEAE3] font-semibold border-b-2 border-[#F2B705]"
                : "text-[#938E83] hover:text-[#EDEAE3]"
            }`}
          >
            All Products ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setLowStockOnly(false);
              }}
              className={`py-2.5 font-medium transition-colors relative cursor-pointer shrink-0 ${
                selectedCategory === cat.id && !lowStockOnly
                  ? "text-[#EDEAE3] font-semibold border-b-2 border-[#F2B705]"
                  : "text-[#938E83] hover:text-[#EDEAE3]"
              }`}
            >
              {cat.name} {cat._count?.products ? `(${cat._count.products})` : ""}
            </button>
          ))}

          {lowStockCount > 0 && (
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`py-2.5 font-medium transition-colors relative cursor-pointer shrink-0 ${
                lowStockOnly
                  ? "text-[#F2B705] font-semibold border-b-2 border-[#F2B705]"
                  : "text-[#F2B705]/80 hover:text-[#F2B705]"
              }`}
            >
              ⚠️ Low Stock Only ({lowStockCount})
            </button>
          )}
        </div>

        {/* Table Viewport (Warm surface tint, 60px row height, no raw-db feel) */}
        <div className="flex-1 overflow-auto bg-transparent px-3 md:px-6 py-4">
          <div className="border border-[#3A3733] rounded-[2px] overflow-hidden bg-[#242320]/70 shadow-sm">
            <table className="w-full text-left border-collapse">
              {/* Table Header */}
              <thead className="bg-[#242320] text-[#938E83] text-[12px] font-mono font-semibold uppercase tracking-wider sticky top-0 border-b border-[#3A3733] z-10">
                <tr className="h-11">
                  <th className="px-4 md:px-6 font-medium">Product & SKU</th>
                  <th className="px-4 md:px-6 font-medium hidden sm:table-cell">Category</th>
                  <th className="px-4 md:px-6 font-medium text-right">Available Stock</th>
                  <th className="px-4 md:px-6 font-medium text-right hidden md:table-cell">Min Reorder Level</th>
                  <th className="px-4 md:px-6 font-medium text-right w-24">Actions</th>
                </tr>
              </thead>

              {/* Table Body: 60px row height with generous padding & warm surface */}
              <tbody className="divide-y divide-[#3A3733] text-[#EDEAE3] text-[14px]">
                {loading && products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-[#938E83]">
                      <div className="flex flex-col items-center justify-center gap-2 font-mono text-[13px]">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#F2B705]" />
                        <span>Loading inventory records...</span>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-[#938E83]">
                      <div className="flex flex-col items-center justify-center gap-3.5 max-w-md mx-auto p-4">
                        <Package className="h-8 w-8 text-[#938E83]/60" />
                        <p className="text-[14.5px] text-[#EDEAE3] font-medium">
                          {searchQuery || selectedCategory !== "all" || lowStockOnly
                            ? "No products match your current filters."
                            : "Your inventory is currently empty. Add your first product to begin tracking."}
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleSeedDemoData}
                            disabled={seeding}
                            className="h-9 px-4 text-xs font-mono text-[#5C9A63] bg-[#1C1B18] hover:bg-[#2D2B27] border border-[#3A3733] rounded-[2px] transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Load Sample Products
                          </button>
                          <button
                            onClick={() => {
                              setProductToEdit(null);
                              setIsPanelOpen(true);
                            }}
                            className="h-9 px-4 text-xs font-bold bg-[#F2B705] text-[#1C1B18] hover:bg-[#deb005] rounded-[2px] transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
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

                    return (
                      <Fragment key={product.id}>
                        <tr
                          onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                          className={`h-[60px] transition-all border-b border-[#3A3733] cursor-pointer group border-l-2 ${
                            isExpanded 
                              ? "bg-[#2D2B27] border-l-[#F2B705]" 
                              : "bg-[#242320]/60 hover:bg-[#2D2B27] border-l-transparent hover:border-l-[#F2B705]"
                          }`}
                        >
                          {/* Product Name (Bold) + SKU (Muted, subordinate) */}
                          <td className="px-4 md:px-6 py-2.5">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-[#F2B705] shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-[#938E83]/40 group-hover:text-[#938E83] shrink-0" />
                              )}
                              <div>
                                <div className="font-semibold text-[14.5px] text-[#EDEAE3] leading-snug">
                                  {product.name}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="font-mono text-[12px] text-[#938E83]">
                                    {product.sku}
                                  </span>
                                  <button
                                    onClick={(e) => handleCopySku(product.sku, e)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-[#938E83] hover:text-[#EDEAE3] transition-opacity"
                                    title="Copy SKU code"
                                  >
                                    {copiedSku === product.sku ? (
                                      <Check className="h-3 w-3 text-[#5C9A63]" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category (Soft Dot + Text, no border box) */}
                          <td className="px-4 md:px-6 hidden sm:table-cell py-2.5">
                            <div className="flex items-center gap-1.5 text-[13px] text-[#938E83]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#F2B705]/80 shrink-0"></span>
                              <span>{product.category?.name || "Unassigned"}</span>
                            </div>
                          </td>

                          {/* Available Stock */}
                          <td className="px-4 md:px-6 text-right py-2.5">
                            <div className="flex flex-col items-end">
                              <div className="font-mono font-bold text-[15px] text-[#EDEAE3]">
                                {product.totalQuantity} <span className="text-xs font-normal text-[#938E83]">{product.unit}</span>
                              </div>
                              <div className="mt-1">
                                {isOutOfStock ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D2482F]">
                                    <AlertTriangle className="h-3 w-3" />
                                    Out of stock
                                  </span>
                                ) : isLow ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F2B705]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#F2B705]"></span>
                                    Low stock
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5C9A63]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#5C9A63]"></span>
                                    In stock
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Min Reorder Level */}
                          <td className="px-4 md:px-6 font-mono text-[14px] text-right text-[#938E83] hidden md:table-cell py-2.5">
                            {product.reorderPoint} {product.unit}
                          </td>

                          {/* Actions */}
                          <td className="px-4 md:px-6 text-right py-2.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setProductToEdit(product);
                                  setIsPanelOpen(true);
                                }}
                                className="p-1.5 text-[#938E83] hover:text-[#EDEAE3] bg-[#1C1B18] hover:bg-[#2D2B27] border border-[#3A3733] rounded-[2px] transition-colors focus-visible:outline-2 focus-visible:outline-[#F2B705] cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id, product.name)}
                                className="p-1.5 text-[#938E83] hover:text-[#D2482F] bg-[#1C1B18] hover:bg-[#D2482F]/10 border border-[#3A3733] hover:border-[#D2482F]/40 rounded-[2px] transition-colors focus-visible:outline-2 focus-visible:outline-[#D2482F] cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Detail Panel (Slight 4px rounding, 3 clean columns) */}
                        {isExpanded && (
                          <tr className="bg-[#1C1B18] border-b border-[#3A3733]">
                            <td colSpan={5} className="p-4 px-4 md:px-6">
                              <div className="bg-[#2D2B27] border border-[#3A3733] rounded-[4px] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#3A3733] text-[13px]">
                                {/* Col 1: Item Details */}
                                <div className="p-4 space-y-2">
                                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#938E83]">
                                    PRODUCT DETAILS
                                  </div>
                                  <div className="text-[#EDEAE3] font-semibold text-[14px]">
                                    {product.name}
                                  </div>
                                  <div className="text-[12px] font-mono text-[#938E83]">
                                    SKU: <span className="text-[#F2B705] font-bold">{product.sku}</span>
                                  </div>
                                  <div className="text-[12px] text-[#938E83]">
                                    Unit: {product.unit} • Category: {product.category?.name || "Unassigned"}
                                  </div>
                                </div>

                                {/* Col 2: Warehouse Location Breakdown */}
                                <div className="p-4 space-y-2">
                                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#938E83]">
                                    WAREHOUSE STORAGE
                                  </div>
                                  {product.levels && product.levels.length > 0 ? (
                                    <div className="space-y-1 font-mono">
                                      {product.levels.map((lvl) => (
                                        <div key={lvl.id} className="flex items-center justify-between text-[#EDEAE3]">
                                          <span className="text-[#938E83]">{lvl.warehouse?.name || "Main Distribution Center"}:</span>
                                          <span className="font-bold">{lvl.quantity} {product.unit}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[12px] text-[#938E83]">
                                      No warehouse stock logged yet. Stock increments automatically when Receipts are validated.
                                    </div>
                                  )}
                                </div>

                                {/* Col 3: Reorder Diagnostics & Friendly Action */}
                                <div className="p-4 space-y-2 flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-mono tracking-widest text-[#938E83]">
                                      REORDER THRESHOLD
                                    </div>
                                    <div className="text-[#EDEAE3]">
                                      Minimum Stock Level: <span className="font-bold text-[#F2B705]">{product.reorderPoint} {product.unit}</span>
                                    </div>
                                    <div className="text-[12px] text-[#938E83]">
                                      {product.totalQuantity <= product.reorderPoint
                                        ? "⚠️ Stock is at or below reorder point. Reordering advised."
                                        : "✓ Inventory is well-stocked above minimum threshold."}
                                    </div>
                                  </div>

                                  <div className="pt-2">
                                    <button
                                      onClick={() => {
                                        setProductToEdit(product);
                                        setIsPanelOpen(true);
                                      }}
                                      className="text-[12px] font-mono text-[#F2B705] hover:underline"
                                    >
                                      Edit product parameters & reorder point →
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

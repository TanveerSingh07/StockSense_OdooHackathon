"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2,
  AlertCircle
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
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
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, lowStockOnly]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Confirm deletion of SKU item "${name}"?`)) {
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

  const lowStockCount = products.filter((p) => p.isLowStock).length;

  return (
    <OperationsShell>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#101312] text-[#E7ECE7]">
        {/* Top Operational Action Bar */}
        <header className="h-12 px-6 border-b border-[#2C332E] flex items-center justify-between bg-[#141816] shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-sans font-semibold text-[#E7ECE7] tracking-tight">
              Products
            </h1>
            <span className="font-mono text-xs text-[#9AA69C] bg-[#181C1A] px-2 py-0.5 rounded-[3px] border border-[#2C332E]">
              {products.length} SKUs
            </span>
            {lowStockCount > 0 && (
              <span className="font-mono text-xs text-[#E8A33D] bg-[#E8A33D]/10 px-2 py-0.5 rounded-[3px] border border-[#E8A33D]/25 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8A33D]"></span>
                {lowStockCount} LOW STOCK
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9AA69C]" />
              <input
                type="text"
                placeholder="Search SKU or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-[13px] bg-[#101312] border border-[#2C332E] rounded-[4px] text-[#E7ECE7] placeholder-[#9AA69C]/50 focus:outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2 text-[13px] bg-[#101312] border border-[#2C332E] rounded-[4px] text-[#9AA69C] focus:text-[#E7ECE7] focus:outline-none focus:border-[#E8A33D]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#181C1A] text-[#E7ECE7]">
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="h-8 w-8 flex items-center justify-center rounded-[4px] border border-[#2C332E] bg-[#181C1A] text-[#9AA69C] hover:text-[#E7ECE7] transition-colors focus-visible:outline-2 focus-visible:outline-[#E8A33D]"
              title="Refresh table"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Primary New Product Action */}
            <button
              onClick={() => {
                setProductToEdit(null);
                setIsPanelOpen(true);
              }}
              className="h-8 px-3 text-xs font-semibold bg-[#E8A33D] text-[#101312] hover:bg-[#d89430] rounded-[4px] transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-white"
            >
              <Plus className="h-3.5 w-3.5" />
              New product
            </button>
          </div>
        </header>

        {/* Dense Table Viewport */}
        <div className="flex-1 overflow-auto bg-[#101312]">
          <table className="w-full text-left border-collapse text-[13px]">
            {/* Table Header */}
            <thead className="bg-[#181C1A] text-[#9AA69C] text-[11px] font-mono uppercase tracking-wider sticky top-0 border-b border-[#2C332E] z-10">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-36">SKU</th>
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold w-40">Category</th>
                <th className="py-2.5 px-4 font-semibold w-24">Unit</th>
                <th className="py-2.5 px-4 font-semibold w-32 text-right">Stock</th>
                <th className="py-2.5 px-4 font-semibold w-32 text-right">Reorder Point</th>
                <th className="py-2.5 px-4 font-semibold w-20 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#2C332E] text-[#E7ECE7]">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#9AA69C]">
                    <div className="flex items-center justify-center gap-2 font-mono text-xs">
                      <RefreshCw className="h-4 w-4 animate-spin text-[#E8A33D]" />
                      <span>QUERYING CATALOG...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-[#9AA69C]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <p className="text-[13px] text-[#9AA69C]">
                        {searchQuery || selectedCategory !== "all"
                          ? "No matching products for current filter criteria."
                          : "No products yet. Add your first one to start tracking stock."}
                      </p>
                      {!searchQuery && selectedCategory === "all" && (
                        <button
                          onClick={() => {
                            setProductToEdit(null);
                            setIsPanelOpen(true);
                          }}
                          className="h-8 px-3 text-xs font-semibold bg-[#E8A33D] text-[#101312] hover:bg-[#d89430] rounded-[4px] transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          New product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isOutOfStock = product.totalQuantity === 0;
                  const isLow = product.totalQuantity <= product.reorderPoint;

                  // Functional Stock Color: Danger for 0, Accent for low stock, Success for healthy
                  const stockColorClass = isOutOfStock
                    ? "text-[#C4553F] font-bold"
                    : isLow
                    ? "text-[#E8A33D] font-bold"
                    : "text-[#6FA66A] font-medium";

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#181C1A] transition-none border-b border-[#2C332E]"
                    >
                      {/* SKU (Monospace) */}
                      <td className="py-2.5 px-4 font-mono text-xs text-[#E7ECE7]">
                        {product.sku}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-4 font-medium text-[#E7ECE7]">
                        {product.name}
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-4 text-[#9AA69C] text-xs">
                        {product.category?.name || "—"}
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-4 text-[#9AA69C] text-xs">
                        {product.unit}
                      </td>

                      {/* Stock on Hand (Monospace with Threshold color) */}
                      <td className={`py-2.5 px-4 font-mono text-xs text-right ${stockColorClass}`}>
                        {product.totalQuantity}
                        {isOutOfStock && <span className="ml-1 text-[10px] text-[#C4553F]">(OUT)</span>}
                        {!isOutOfStock && isLow && <span className="ml-1 text-[10px] text-[#E8A33D]">(LOW)</span>}
                      </td>

                      {/* Reorder Point (Monospace) */}
                      <td className="py-2.5 px-4 font-mono text-xs text-right text-[#9AA69C]">
                        {product.reorderPoint}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setProductToEdit(product);
                              setIsPanelOpen(true);
                            }}
                            className="p-1 text-[#9AA69C] hover:text-[#E7ECE7] rounded-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-[#E8A33D]"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1 text-[#9AA69C] hover:text-[#C4553F] rounded-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-[#C4553F]"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

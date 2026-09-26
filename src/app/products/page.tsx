"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Search, 
  Plus, 
  Package, 
  AlertTriangle, 
  Filter, 
  RefreshCw, 
  Layers,
  CheckCircle2,
  Trash2,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductFormDialog } from "@/components/products/product-form-dialog";

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

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, lowStockOnly]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also remove associated stock levels.`)) {
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
  const totalStockUnits = products.reduce((sum, p) => sum + (p.totalQuantity || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Product Catalog
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage product master data, SKUs, categories, and stock reorder rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchProducts}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => {
              setProductToEdit(null);
              setIsDialogOpen(true);
            }}
            className="gap-2 bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xs border border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Total Products</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {products.length}
              <Layers className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Total Stock on Hand</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between text-blue-600 dark:text-blue-400">
              {totalStockUnits}
              <span className="text-xs font-normal text-muted-foreground">units</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className={`shadow-xs border ${lowStockCount > 0 ? "border-amber-500/40 bg-amber-500/5" : "border-border"}`}>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Low Stock Alerts</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between text-amber-600 dark:text-amber-400">
              {lowStockCount}
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="shadow-xs border border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Category:
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-3 py-1 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setLowStockOnly((prev) => !prev)}
                className={`h-9 px-3 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  lowStockOnly
                    ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400"
                    : "bg-background border-input text-foreground hover:bg-muted"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Low Stock Only
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-xs border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-5 py-3 font-semibold">SKU</th>
                <th className="px-5 py-3 font-semibold">Product Name</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Unit</th>
                <th className="px-5 py-3 font-semibold text-right">Reorder Point</th>
                <th className="px-5 py-3 font-semibold text-right">Available Stock</th>
                <th className="px-5 py-3 font-semibold text-center">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-10 w-10 text-muted-foreground/60" />
                      <p className="text-base font-medium text-foreground">No products found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {searchQuery || selectedCategory !== "all" || lowStockOnly
                          ? "Try adjusting your search query or filters."
                          : "Get started by adding your first product to the inventory."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr 
                    key={product.id} 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-medium text-foreground">
                      <span className="bg-muted px-2 py-1 rounded border border-border">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {product.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      {product.unit}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-muted-foreground">
                      {product.reorderPoint}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold">
                      <span className={product.isLowStock ? "text-amber-600 dark:text-amber-400" : "text-foreground"}>
                        {product.totalQuantity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {product.totalQuantity === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          Out of Stock
                        </span>
                      ) : product.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setProductToEdit(product);
                            setIsDialogOpen(true);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id, product.name)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Product Form Dialog */}
      <ProductFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
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
  );
}


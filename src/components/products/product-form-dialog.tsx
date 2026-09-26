"use client";

import { useState, useEffect } from "react";
import { X, Package, AlertCircle, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category, Product } from "@/app/products/page";

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  onCategoryCreated?: (newCategory: Category) => void;
}

export function ProductFormDialog({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
  categories,
  onCategoryCreated,
}: ProductFormDialogProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [unit, setUnit] = useState("Units");
  const [reorderPoint, setReorderPoint] = useState("10");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || "");
      setSku(productToEdit.sku || "");
      setCategoryId(productToEdit.categoryId || "");
      setUnit(productToEdit.unit || "Units");
      setReorderPoint(productToEdit.reorderPoint !== undefined ? String(productToEdit.reorderPoint) : "10");
      setIsAddingNewCategory(false);
      setNewCategoryName("");
    } else {
      setName("");
      setSku("");
      setCategoryId(categories.length > 0 ? categories[0].id : "");
      setUnit("Units");
      setReorderPoint("10");
      setIsAddingNewCategory(false);
      setNewCategoryName("");
    }
    setError(null);
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product Name is required");
      return;
    }

    if (!sku.trim()) {
      setError("SKU is required");
      return;
    }

    if (isAddingNewCategory && !newCategoryName.trim()) {
      setError("Please enter a new category name or select an existing one");
      return;
    }

    if (!isAddingNewCategory && !categoryId) {
      setError("Please select a category");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        unit: unit.trim() || "Units",
        reorderPoint: Number(reorderPoint) || 0,
      };

      if (isAddingNewCategory) {
        payload.categoryName = newCategoryName.trim();
      } else {
        payload.categoryId = categoryId;
      }

      let res;
      if (productToEdit) {
        res = await fetch(`/api/products/${productToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Failed to save product");
        return;
      }

      if (isAddingNewCategory && json.data?.category && onCategoryCreated) {
        onCategoryCreated(json.data.category);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg bg-card text-card-foreground border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {productToEdit ? "Edit Product" : "Create New Product"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Wireless Ergonomic Mouse"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sku" className="text-sm font-medium">
                SKU Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sku"
                placeholder="e.g. ELEC-MOU-001"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-sm font-medium">
                Unit of Measure
              </Label>
              <Input
                id="unit"
                placeholder="e.g. Units, pcs, kg"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          {/* Category Selector with Inline Creation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {isAddingNewCategory ? "Choose existing" : "+ Add new category"}
              </button>
            </div>

            {isAddingNewCategory ? (
              <Input
                placeholder="Enter new category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
            ) : (
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 px-3 py-1 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Reorder Point */}
          <div className="space-y-1.5">
            <Label htmlFor="reorderPoint" className="text-sm font-medium">
              Reorder Point (Low-stock threshold)
            </Label>
            <Input
              id="reorderPoint"
              type="number"
              min="0"
              placeholder="10"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              When total stock reaches or drops below this number, the product will be flagged as Low Stock.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-primary text-primary-foreground"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {productToEdit ? "Update Product" : "Create Product"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

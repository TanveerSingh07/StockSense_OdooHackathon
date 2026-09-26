"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, FolderPlus, Sparkles } from "lucide-react";
import { Category, Product } from "@/app/products/page";

interface ProductFormSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  onCategoryCreated?: (newCategory: Category) => void;
}

export function ProductFormSlideOver({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
  categories,
  onCategoryCreated,
}: ProductFormSlideOverProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [unit, setUnit] = useState("Units");
  const [reorderPoint, setReorderPoint] = useState("10");
  const [initialStock, setInitialStock] = useState("0");

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name || "");
        setSku(productToEdit.sku || "");
        setCategoryId(productToEdit.categoryId || (categories[0]?.id ?? ""));
        setUnit(productToEdit.unit || "Units");
        setReorderPoint(productToEdit.reorderPoint !== undefined ? String(productToEdit.reorderPoint) : "10");
        setInitialStock(String(productToEdit.totalQuantity || 0));
        setIsAddingNewCategory(false);
        setNewCategoryName("");
      } else {
        setName("");
        setSku("");
        setCategoryId(categories.length > 0 ? categories[0].id : "");
        setUnit("Units");
        setReorderPoint("10");
        setInitialStock("0");
        setIsAddingNewCategory(false);
        setNewCategoryName("");
      }
      setFieldErrors({});
      setGeneralError(null);

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [productToEdit, isOpen, categories]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = "Product name is required";
    }

    if (!sku.trim()) {
      errors.sku = "SKU is required";
    }

    if (isAddingNewCategory && !newCategoryName.trim()) {
      errors.category = "Category name is required";
    } else if (!isAddingNewCategory && !categoryId) {
      errors.category = "Category is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      let finalCategoryId = categoryId;

      if (isAddingNewCategory && newCategoryName.trim()) {
        const catRes = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCategoryName.trim() }),
        });

        const catData = await catRes.json();
        if (!catData.success) {
          setFieldErrors({ category: catData.message || "Failed to create category" });
          setLoading(false);
          return;
        }

        finalCategoryId = catData.data.id;
        if (onCategoryCreated) {
          onCategoryCreated(catData.data);
        }
      }

      const payload: any = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        categoryId: finalCategoryId,
        unit: unit.trim() || "Units",
        reorderPoint: parseInt(reorderPoint, 10) || 0,
      };

      if (!productToEdit && Number(initialStock) > 0) {
        payload.initialStock = Number(initialStock);
      }

      const url = productToEdit ? `/api/products/${productToEdit.id}` : "/api/products";
      const method = productToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.message?.toLowerCase().includes("sku")) {
          setFieldErrors({ sku: data.message });
        } else {
          setGeneralError(data.message || "Failed to save product");
        }
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-[#161B22] text-[#F0F6FC] shadow-2xl border-l border-white/[0.08] flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#161B22]">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                {productToEdit ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {productToEdit
                  ? "Update product metadata and reorder threshold"
                  : "Register a new SKU in your catalog"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form Content */}
          <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {generalError && (
              <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                {generalError}
              </div>
            )}

            {/* Product Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="e.g. Wireless Barcode Scanner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-[#0D1117] border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                  fieldErrors.name ? "border-red-500" : "border-white/[0.08]"
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                SKU / Barcode <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ELEC-SCN-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={`w-full px-3 py-2 text-sm font-mono bg-[#0D1117] border rounded-lg text-white placeholder-slate-500 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                  fieldErrors.sku ? "border-red-500" : "border-white/[0.08]"
                }`}
              />
              {fieldErrors.sku && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.sku}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Category <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  {isAddingNewCategory ? "Choose existing" : "+ New Category"}
                </button>
              </div>

              {isAddingNewCategory ? (
                <input
                  type="text"
                  placeholder="Enter new category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-[#0D1117] border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    fieldErrors.category ? "border-red-500" : "border-white/[0.08]"
                  }`}
                />
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-[#0D1117] border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors ${
                    fieldErrors.category ? "border-red-500" : "border-white/[0.08]"
                  }`}
                >
                  <option value="" disabled>Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#161B22] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.category && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.category}</p>
              )}
            </div>

            {/* Unit & Reorder Point Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Unit of Measure
                </label>
                <input
                  type="text"
                  placeholder="e.g. Units, Boxes"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Reorder Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="10"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Initial Stock (Only for new products) */}
            {!productToEdit && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Initial Starting Stock
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#0D1117] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Sets the starting quantity in the Main Warehouse.
                </p>
              </div>
            )}
          </form>

          {/* Footer Actions */}
          <div className="p-4 px-6 border-t border-white/[0.08] bg-[#161B22] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{productToEdit ? "Save Changes" : "Create Product"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

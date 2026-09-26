"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
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
      setFieldErrors({});
      setGeneralError(null);

      // Auto-focus name field after slide in
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [productToEdit, isOpen, categories]);

  // Keyboard shortcut: Escape to close
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
        if (json.message?.toLowerCase().includes("sku")) {
          setFieldErrors({ sku: "SKU already exists in the system" });
        } else {
          setGeneralError(json.message || "Failed to save product");
        }
        return;
      }

      if (isAddingNewCategory && json.data?.category && onCategoryCreated) {
        onCategoryCreated(json.data.category);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setGeneralError(err?.message || "An unexpected network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[1px] transition-opacity duration-200">
      {/* Backdrop click dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="w-full max-w-md h-full bg-[#181C1A] border-l border-[#2C332E] flex flex-col shadow-none animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-12 px-5 border-b border-[#2C332E] flex items-center justify-between bg-[#141816] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#E8A33D] font-bold tracking-wider uppercase">
              {productToEdit ? "[ EDIT PRODUCT ]" : "[ NEW PRODUCT ]"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9AA69C] hover:text-[#E7ECE7] p-1 rounded-[4px] transition-colors focus-visible:outline-2 focus-visible:outline-[#E8A33D]"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto p-5 space-y-4">
          <div className="space-y-4">
            {generalError && (
              <div className="p-2.5 text-xs text-[#C4553F] bg-[#C4553F]/10 border border-[#C4553F]/30 rounded-[4px]">
                {generalError}
              </div>
            )}

            {/* Field: Product Name */}
            <div className="space-y-1">
              <label htmlFor="prod-name" className="block text-[15px] font-medium text-[#E7ECE7]">
                Product Name <span className="text-[#C4553F]">*</span>
              </label>
              <input
                id="prod-name"
                ref={nameInputRef}
                type="text"
                placeholder="e.g. Standard Steel Bracket"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-[#101312] border border-[#2C332E] rounded-[4px] text-[#E7ECE7] placeholder-[#9AA69C]/40 focus:outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]"
              />
              {fieldErrors.name && (
                <p className="text-xs text-[#C4553F] pt-0.5">{fieldErrors.name}</p>
              )}
            </div>

            {/* Field: SKU */}
            <div className="space-y-1">
              <label htmlFor="prod-sku" className="block text-[15px] font-medium text-[#E7ECE7]">
                SKU <span className="text-[#C4553F]">*</span>
              </label>
              <input
                id="prod-sku"
                type="text"
                placeholder="e.g. BRK-001"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 font-mono text-[13px] bg-[#101312] border border-[#2C332E] rounded-[4px] text-[#E7ECE7] placeholder-[#9AA69C]/40 uppercase focus:outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]"
              />
              {fieldErrors.sku && (
                <p className="text-xs text-[#C4553F] pt-0.5">{fieldErrors.sku}</p>
              )}
            </div>

            {/* Grouped Row: Category + Unit */}
            <div className="grid grid-cols-2 gap-3">
              {/* Category */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="prod-cat" className="block text-[15px] font-medium text-[#E7ECE7]">
                    Category <span className="text-[#C4553F]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                    className="text-[11px] text-[#E8A33D] hover:underline"
                  >
                    {isAddingNewCategory ? "Select" : "+ New"}
                  </button>
                </div>

                {isAddingNewCategory ? (
                  <input
                    type="text"
                    placeholder="New category..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full h-9 px-2.5 text-[13px] bg-[#101312] border border-[#2C332E] rounded-[4px] text-[#E7ECE7] placeholder-[#9AA69C]/40 focus:outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]"
                    autoFocus
                  />
                ) : (
                  <select
                    id="prod-cat"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-9 px-2 text-[13px] bg-[#101312] border border-[#2C332E] rounded-[4px] text-[#E7ECE7] focus:outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]"
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#181C1A]">
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                )}
                {fieldErrors.category && (
                  <p className="text-xs text-[#C4553F] pt-0.5">{fieldErrors.category}</p>
                )}
              </div>

              {/* Unit */}
              <div className="space-y-1">
                <label htmlFor="prod-unit" className="block text-[15px] font-medium text-[#E7ECE7]">
                  Unit
                </label>
                <input
                  id="prod-unit"
                  type="text"
                  placeholder="Units, pcs, kg"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] bg-[#101312] border border-[#2C332E] rounded-[4px] text-[#E7ECE7] placeholder-[#9AA69C]/40 focus:outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]"
                />
              </div>
            </div>

            {/* Field: Reorder Point */}
            <div className="space-y-1 pt-1">
              <label htmlFor="prod-reorder" className="block text-[15px] font-medium text-[#E7ECE7]">
                Reorder Point
              </label>
              <input
                id="prod-reorder"
                type="number"
                min="0"
                placeholder="10"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
                className="w-full h-9 px-3 font-mono text-[13px] bg-[#101312] border border-[#2C332E] rounded-[4px] text-[#E7ECE7] placeholder-[#9AA69C]/40 focus:outline-none focus:border-[#E8A33D] focus:ring-1 focus:ring-[#E8A33D]"
              />
              <p className="text-[11px] text-[#9AA69C]">
                Alert threshold: stock at or below this triggers amber indicator.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-[#2C332E] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-xs text-[#9AA69C] hover:text-[#E7ECE7] transition-colors focus-visible:outline-2 focus-visible:outline-[#E8A33D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold bg-[#E8A33D] text-[#101312] hover:bg-[#d89430] rounded-[4px] transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {loading
                ? "Saving..."
                : productToEdit
                ? "Save changes"
                : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

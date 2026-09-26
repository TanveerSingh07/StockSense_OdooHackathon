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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 transition-opacity duration-200">
      {/* Backdrop click dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="w-full max-w-md h-full bg-[#242320] border-l border-[#3A3733] flex flex-col shadow-none animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-[#3A3733] flex items-center justify-between bg-[#242320] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#F2B705] font-bold tracking-widest uppercase">
              {productToEdit ? "[ EDIT PRODUCT ]" : "[ NEW PRODUCT ]"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#938E83] hover:text-[#EDEAE3] p-1 rounded-[2px] transition-colors focus-visible:outline-2 focus-visible:outline-[#F2B705]"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto p-6 space-y-5">
          <div className="space-y-4">
            {generalError && (
              <div className="p-2.5 text-xs text-[#D2482F] bg-[#D2482F]/10 border border-[#D2482F]/30 rounded-[2px]">
                {generalError}
              </div>
            )}

            {/* Field: Product Name */}
            <div className="space-y-1.5">
              <label htmlFor="prod-name" className="block text-[15px] font-medium text-[#EDEAE3]">
                Product Name <span className="text-[#D2482F]">*</span>
              </label>
              <input
                id="prod-name"
                ref={nameInputRef}
                type="text"
                placeholder="e.g. Standard Steel Bracket"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 text-[14px] bg-[#1C1B18] border border-[#3A3733] rounded-[2px] text-[#EDEAE3] placeholder-[#938E83]/40 focus:outline-none focus:border-[#F2B705] focus:ring-0 transition-colors"
              />
              {fieldErrors.name && (
                <p className="text-xs text-[#D2482F] pt-0.5">{fieldErrors.name}</p>
              )}
            </div>

            {/* Field: SKU */}
            <div className="space-y-1.5">
              <label htmlFor="prod-sku" className="block text-[15px] font-medium text-[#EDEAE3]">
                SKU <span className="text-[#D2482F]">*</span>
              </label>
              <input
                id="prod-sku"
                type="text"
                placeholder="e.g. BRK-001"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full h-10 px-3 font-mono text-[14px] bg-[#1C1B18] border border-[#3A3733] rounded-[2px] text-[#EDEAE3] placeholder-[#938E83]/40 uppercase focus:outline-none focus:border-[#F2B705] focus:ring-0 transition-colors"
              />
              {fieldErrors.sku && (
                <p className="text-xs text-[#D2482F] pt-0.5">{fieldErrors.sku}</p>
              )}
            </div>

            {/* Grouped Row: Category + Unit */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Category */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="prod-cat" className="block text-[15px] font-medium text-[#EDEAE3]">
                    Category <span className="text-[#D2482F]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                    className="text-[11px] font-mono text-[#F2B705] hover:underline"
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
                    className="w-full h-10 px-3 text-[14px] bg-[#1C1B18] border border-[#3A3733] rounded-[2px] text-[#EDEAE3] placeholder-[#938E83]/40 focus:outline-none focus:border-[#F2B705] focus:ring-0 transition-colors"
                    autoFocus
                  />
                ) : (
                  <select
                    id="prod-cat"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-2.5 text-[14px] bg-[#1C1B18] border border-[#3A3733] rounded-[2px] text-[#EDEAE3] focus:outline-none focus:border-[#F2B705] focus:ring-0 transition-colors"
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#242320]">
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                )}
                {fieldErrors.category && (
                  <p className="text-xs text-[#D2482F] pt-0.5">{fieldErrors.category}</p>
                )}
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <label htmlFor="prod-unit" className="block text-[15px] font-medium text-[#EDEAE3]">
                  Unit
                </label>
                <input
                  id="prod-unit"
                  type="text"
                  placeholder="Units, pcs, kg"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-10 px-3 text-[14px] bg-[#1C1B18] border border-[#3A3733] rounded-[2px] text-[#EDEAE3] placeholder-[#938E83]/40 focus:outline-none focus:border-[#F2B705] focus:ring-0 transition-colors"
                />
              </div>
            </div>

            {/* Field: Reorder Point */}
            <div className="space-y-1.5 pt-1">
              <label htmlFor="prod-reorder" className="block text-[15px] font-medium text-[#EDEAE3]">
                Reorder Point
              </label>
              <input
                id="prod-reorder"
                type="number"
                min="0"
                placeholder="10"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
                className="w-full h-10 px-3 font-mono text-[14px] bg-[#1C1B18] border border-[#3A3733] rounded-[2px] text-[#EDEAE3] placeholder-[#938E83]/40 focus:outline-none focus:border-[#F2B705] focus:ring-0 transition-colors"
              />
              <p className="text-[12px] text-[#938E83]">
                Alert threshold: stock at or below this triggers yellow indicator.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-[#3A3733] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-mono text-[#938E83] hover:text-[#EDEAE3] transition-colors focus-visible:outline-2 focus-visible:outline-[#F2B705]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-[13.5px] font-bold bg-[#F2B705] text-[#1C1B18] hover:bg-[#deb005] active:scale-[0.98] transition-all duration-100 rounded-[2px] flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 select-none cursor-pointer"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
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

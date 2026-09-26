'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Plus, 
  X,
  History,
  Tag
} from 'lucide-react';
import { Product } from '@/app/products/page';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onOpenCreateProduct: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onOpenCreateProduct,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = products.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    );
  }).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-[#1E293B] border border-white/[0.1] rounded-lg shadow-2xl overflow-hidden z-10 text-zinc-100 animate-in zoom-in-95 duration-150">
        {/* Search Bar */}
        <div className="flex items-center px-3.5 border-b border-white/[0.08] bg-[#0F172A]">
          <Search className="h-4 w-4 text-zinc-400 shrink-0 mr-2.5" />
          <input
            type="text"
            placeholder="Search products or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full h-11 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          <div>
            <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400">
              Quick actions
            </div>
            <div className="grid grid-cols-2 gap-1 mt-0.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateProduct();
                }}
                className="flex items-center gap-2 p-2 rounded-md text-xs text-zinc-200 hover:text-white hover:bg-white/[0.06] transition text-left cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-zinc-400" />
                <span>Add product</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push('/receipts/new');
                }}
                className="flex items-center gap-2 p-2 rounded-md text-xs text-zinc-200 hover:text-white hover:bg-white/[0.06] transition text-left cursor-pointer"
              >
                <ArrowDownLeft className="h-3.5 w-3.5 text-zinc-400" />
                <span>Receive stock</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push('/deliveries/new');
                }}
                className="flex items-center gap-2 p-2 rounded-md text-xs text-zinc-200 hover:text-white hover:bg-white/[0.06] transition text-left cursor-pointer"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
                <span>Create delivery</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push('/adjustments/new');
                }}
                className="flex items-center gap-2 p-2 rounded-md text-xs text-zinc-200 hover:text-white hover:bg-white/[0.06] transition text-left cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
                <span>Adjust stock</span>
              </button>
            </div>
          </div>

          {/* Matching Products */}
          <div>
            <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400">
              Products ({filtered.length})
            </div>
            <div className="space-y-0.5 mt-0.5">
              {filtered.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => {
                    onClose();
                    onSelectProduct(prod);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-md text-xs text-zinc-200 hover:text-white hover:bg-white/[0.06] transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 shrink-0">
                      <Package className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-zinc-100">
                        {prod.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                        <span>{prod.sku}</span>
                        <span>•</span>
                        <span>{prod.category?.name || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs text-zinc-300">
                      {prod.totalQuantity} {prod.unit}
                    </span>
                  </div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  No matching products found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2 bg-[#0F172A] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span>Navigate:</span>
            <kbd className="px-1 py-0.2 bg-white/[0.06] border border-white/[0.08] rounded text-[10px] text-zinc-400">↑↓</kbd>
            <kbd className="px-1 py-0.2 bg-white/[0.06] border border-white/[0.08] rounded text-[10px] text-zinc-400">↵</kbd>
          </div>
          <div>
            Press <kbd className="px-1 py-0.2 bg-white/[0.06] border border-white/[0.08] rounded text-[10px] text-zinc-400">ESC</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
}

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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Search Bar */}
        <div className="flex items-center px-4 border-b border-white/10 bg-[#0F172A]/50">
          <Search className="h-5 w-5 text-amber-400 shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Search products, SKU codes, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full h-13 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          <div>
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Quick Operations
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateProduct();
                }}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-amber-500/10 hover:border-amber-500/20 border border-transparent transition text-left cursor-pointer"
              >
                <Plus className="h-4 w-4 text-amber-400" />
                <span>Add New Product</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push('/receipts/new');
                }}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-sky-500/10 hover:border-sky-500/20 border border-transparent transition text-left cursor-pointer"
              >
                <ArrowDownLeft className="h-4 w-4 text-sky-400" />
                <span>New Inbound Receipt</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push('/deliveries/new');
                }}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-emerald-500/10 hover:border-emerald-500/20 border border-transparent transition text-left cursor-pointer"
              >
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                <span>New Outbound Delivery</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push('/adjustments/new');
                }}
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-indigo-500/10 hover:border-indigo-500/20 border border-transparent transition text-left cursor-pointer"
              >
                <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
                <span>Physical Adjustment</span>
              </button>
            </div>
          </div>

          {/* Matching Products */}
          <div>
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Products ({filtered.length})
            </div>
            <div className="space-y-1 mt-1">
              {filtered.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => {
                    onClose();
                    onSelectProduct(prod);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/5 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {prod.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>{prod.sku}</span>
                        <span>•</span>
                        <span>{prod.category?.name || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-white font-mono text-xs">
                      {prod.totalQuantity} {prod.unit}
                    </span>
                  </div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No matching products found for "{query}".
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#0F172A] border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300">↑↓</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300">Enter</kbd>
          </div>
          <div>
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300">ESC</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Tag, X, Check } from 'lucide-react';
import { Category } from '@/app/products/page';

interface FloatingBulkBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExportSelected: () => void;
  onDeleteSelected: () => void;
  onChangeCategory: (newCategoryId: string) => void;
  categories: Category[];
}

export function FloatingBulkBar({
  selectedCount,
  onClearSelection,
  onExportSelected,
  onDeleteSelected,
  onChangeCategory,
  categories,
}: FloatingBulkBarProps) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4"
        >
          <div className="pointer-events-auto bg-[#1E293B]/90 border border-white/15 text-slate-100 rounded-2xl shadow-2xl p-2 sm:p-2.5 px-4 sm:px-5 flex flex-wrap items-center gap-2 sm:gap-4 backdrop-blur-xl">
            {/* Selected Count Badge */}
            <div className="flex items-center gap-2 pr-2 border-r border-white/10">
              <span className="h-5 w-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                {selectedCount}
              </span>
              <span className="text-xs font-bold text-white">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </span>
            </div>

            {/* Change Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="h-8 px-3 text-xs font-semibold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Tag className="h-3.5 w-3.5 text-amber-400" />
                <span>Change Category</span>
              </button>

              {showCategoryMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#1E293B] border border-white/15 rounded-2xl shadow-2xl p-1 z-50 space-y-0.5 backdrop-blur-xl">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Select New Category
                  </div>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onChangeCategory(c.id);
                        setShowCategoryMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Selected Button */}
            <button
              onClick={onExportSelected}
              className="h-8 px-3 text-xs font-semibold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" />
              <span>Export CSV</span>
            </button>

            {/* Delete Selected Button */}
            <button
              onClick={onDeleteSelected}
              className="h-8 px-3 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>

            {/* Dismiss X Button */}
            <button
              onClick={onClearSelection}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-1"
              title="Deselect all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

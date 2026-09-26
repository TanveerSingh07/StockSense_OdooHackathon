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
          <div className="pointer-events-auto bg-[#161B22] border border-white/[0.14] text-[#F0F6FC] rounded-2xl shadow-2xl p-2 sm:p-2.5 px-4 sm:px-5 flex flex-wrap items-center gap-2 sm:gap-4 backdrop-blur-md">
            {/* Selected Count Badge */}
            <div className="flex items-center gap-2 pr-2 border-r border-white/[0.1]">
              <span className="h-5 w-5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center justify-center">
                {selectedCount}
              </span>
              <span className="text-xs font-semibold text-white">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </span>
            </div>

            {/* Change Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="h-8 px-3 text-xs font-medium text-slate-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Tag className="h-3.5 w-3.5 text-emerald-400" />
                <span>Change Category</span>
              </button>

              {showCategoryMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#161B22] border border-white/[0.1] rounded-xl shadow-xl p-1 z-50 space-y-0.5">
                  <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Select New Category
                  </div>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onChangeCategory(c.id);
                        setShowCategoryMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
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
              className="h-8 px-3 text-xs font-medium text-slate-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>

            {/* Delete Selected Button */}
            <button
              onClick={onDeleteSelected}
              className="h-8 px-3 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>

            {/* Dismiss X Button */}
            <button
              onClick={onClearSelection}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer ml-1"
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

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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4"
        >
          <div className="pointer-events-auto bg-[#1E293B] border border-white/[0.1] text-zinc-100 rounded-lg shadow-xl p-2 px-3 flex flex-wrap items-center gap-2.5">
            {/* Selected Count */}
            <div className="flex items-center gap-2 pr-2.5 border-r border-white/[0.08]">
              <span className="h-5 min-w-5 px-1.5 rounded bg-amber-500 text-zinc-950 font-semibold text-xs flex items-center justify-center">
                {selectedCount}
              </span>
              <span className="text-xs font-medium text-zinc-200">
                {selectedCount === 1 ? '1 item selected' : `${selectedCount} items selected`}
              </span>
            </div>

            {/* Change Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="h-8 px-2.5 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Tag className="h-3.5 w-3.5 text-zinc-400" />
                <span>Change category</span>
              </button>

              {showCategoryMenu && (
                <div className="absolute bottom-full mb-1.5 left-0 w-44 bg-[#1E293B] border border-white/[0.1] rounded-lg shadow-xl p-1 z-50 space-y-0.5">
                  <div className="px-2 py-1 text-[10px] text-zinc-400 font-medium">
                    Select category
                  </div>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onChangeCategory(c.id);
                        setShowCategoryMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
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
              className="h-8 px-2.5 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>Export CSV</span>
            </button>

            {/* Delete Selected Button */}
            <button
              onClick={onDeleteSelected}
              className="h-8 px-2.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>

            {/* Dismiss X Button */}
            <button
              onClick={onClearSelection}
              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] rounded transition-colors cursor-pointer ml-0.5"
              title="Deselect all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

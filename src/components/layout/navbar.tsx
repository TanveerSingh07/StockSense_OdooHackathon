'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Boxes, 
  ChevronDown, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal,
  Package,
  History,
  Settings,
  ShieldCheck
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [operationsOpen, setOperationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const isOperationsActive = 
    pathname.startsWith('/receipts') ||
    pathname.startsWith('/deliveries') ||
    pathname.startsWith('/adjustments');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOperationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A]/85 backdrop-blur-xl border-b border-white/10 select-none">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* FAR LEFT: Brand Logo & Version Tag */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-white group">
              <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
                <Boxes className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="font-bold text-[15px] tracking-tight">StockSense</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
                v2.0
              </span>
            </Link>
          </div>

          {/* CENTER: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold absolute left-1/2 -translate-x-1/2">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-xl transition-all ${
                isActive('/') && pathname === '/'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Dashboard
            </Link>

            {/* Operations Dropdown with Transparent Frosted Glass */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOperationsOpen(!operationsOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  isOperationsActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Operations</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${operationsOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </button>

              {operationsOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#1E293B]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    href="/receipts"
                    className="flex items-center gap-3 p-2.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition"
                    onClick={() => setOperationsOpen(false)}
                  >
                    <div className="h-7 w-7 rounded-lg bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center font-bold shrink-0">
                      <ArrowDownLeft className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Receipts</div>
                      <div className="text-[10px] text-slate-400">Inbound supplier shipments</div>
                    </div>
                  </Link>

                  <Link
                    href="/deliveries"
                    className="flex items-center gap-3 p-2.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition"
                    onClick={() => setOperationsOpen(false)}
                  >
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Deliveries</div>
                      <div className="text-[10px] text-slate-400">Outbound customer dispatches</div>
                    </div>
                  </Link>

                  <div className="my-1 border-t border-white/10" />

                  <Link
                    href="/adjustments/new"
                    className="flex items-center gap-3 p-2.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition"
                    onClick={() => setOperationsOpen(false)}
                  >
                    <div className="h-7 w-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Stock Adjustments</div>
                      <div className="text-[10px] text-slate-400">Physical count audit diffs</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/products"
              className={`px-3 py-1.5 rounded-xl transition-all ${
                isActive('/products')
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Stock Catalog
            </Link>

            <Link
              href="/history"
              className={`px-3 py-1.5 rounded-xl transition-all ${
                isActive('/history')
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Move History
            </Link>

            <Link
              href="/settings/warehouses"
              className={`px-3 py-1.5 rounded-xl transition-all ${
                isActive('/settings')
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Settings
            </Link>
          </nav>

          {/* FAR RIGHT: Admin Profile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="h-7.5 w-7.5 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-inner">
                AD
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-semibold text-white flex items-center gap-1 leading-tight">
                  <span>Admin User</span>
                  <ShieldCheck className="h-3 w-3 text-amber-400" />
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Central Warehouse</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

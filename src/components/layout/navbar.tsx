'use client';

import { useState } from 'react';
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

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090C10]/90 backdrop-blur-md border-b border-white/[0.08] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-white group">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/30 group-hover:bg-emerald-500 transition-colors">
                <Boxes className="h-4.5 w-4.5" />
              </div>
              <span className="font-semibold text-[15px]">StockSense</span>
              <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 ml-0.5">
                v1.0
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isActive('/') && pathname === '/'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Dashboard
              </Link>

              {/* Operations Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOperationsOpen(!operationsOpen)}
                  onBlur={() => setTimeout(() => setOperationsOpen(false), 200)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    pathname.startsWith('/receipts') ||
                    pathname.startsWith('/deliveries') ||
                    pathname.startsWith('/adjustments')
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>Operations</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${operationsOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>

                {operationsOpen && (
                  <div className="absolute left-0 mt-1.5 w-60 bg-[#161B22] rounded-xl shadow-2xl border border-white/[0.08] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <Link
                      href="/receipts"
                      className="flex items-center gap-3 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition"
                      onClick={() => setOperationsOpen(false)}
                    >
                      <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                        <ArrowDownLeft className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Receipts</div>
                        <div className="text-[11px] text-slate-400">Inbound supplier shipments</div>
                      </div>
                    </Link>

                    <Link
                      href="/deliveries"
                      className="flex items-center gap-3 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition"
                      onClick={() => setOperationsOpen(false)}
                    >
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Deliveries</div>
                        <div className="text-[11px] text-slate-400">Outbound customer dispatches</div>
                      </div>
                    </Link>

                    <Link
                      href="/adjustments/new"
                      className="flex items-center gap-3 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition border-t border-white/[0.06] mt-1 pt-2"
                      onClick={() => setOperationsOpen(false)}
                    >
                      <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0">
                        <SlidersHorizontal className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Stock Adjustments</div>
                        <div className="text-[11px] text-slate-400">Physical inventory reconciliation</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/products"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isActive('/products')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Stock Catalog
              </Link>

              <Link
                href="/history"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isActive('/history')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Move History
              </Link>

              <Link
                href="/settings/warehouses"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isActive('/settings')
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Settings
              </Link>
            </nav>
          </div>

          {/* Right side Profile & Quick Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-semibold shadow-inner">
                AD
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-medium text-white flex items-center gap-1">
                  <span>Admin User</span>
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-400">Main Distribution Center</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

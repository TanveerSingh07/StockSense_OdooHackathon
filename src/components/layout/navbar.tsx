'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Boxes, 
  ChevronDown, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight,
  SlidersHorizontal,
  Package,
  History,
  Settings,
  ShieldCheck,
  LogOut,
  User
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/forgot-password' || 
    pathname.startsWith('/reset-password');

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const isOperationsActive = 
    pathname.startsWith('/receipts') ||
    pathname.startsWith('/deliveries') ||
    pathname.startsWith('/adjustments') ||
    pathname.startsWith('/transfers');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOperationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#060e20]/90 backdrop-blur-xl border-b border-[#2d3449]/80 select-none">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-[#dae2fd] group">
              <div className="h-8 w-8 rounded-lg bg-[#171f33] border border-[#ffc174]/30 text-[#ffc174] flex items-center justify-center font-black shadow-md shadow-[#ffc174]/10 group-hover:border-[#ffc174]/60 transition-colors">
                <Boxes className="h-4 w-4" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight">StockSense</span>
              <span className="text-[10px] font-mono font-bold text-[#ffc174] bg-[#ffc174]/10 px-1.5 py-0.5 rounded-full border border-[#ffc174]/20">
                v1.0
              </span>
            </Link>
          </div>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium absolute left-1/2 -translate-x-1/2">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive('/') && pathname === '/'
                  ? 'bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/25 font-semibold'
                  : 'text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#171f33]'
              }`}
            >
              Dashboard
            </Link>

            {/* Operations Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOperationsOpen(!operationsOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isOperationsActive
                    ? 'bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/25 font-semibold'
                    : 'text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#171f33]'
                }`}
              >
                <span>Operations</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${operationsOpen ? 'rotate-180 text-[#ffc174]' : ''}`} />
              </button>

              {operationsOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#131b2e]/95 backdrop-blur-2xl rounded-xl shadow-2xl border border-[#2d3449] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    href="/receipts"
                    className="flex items-center gap-3 p-2 rounded-lg text-xs text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#222a3d] transition"
                    onClick={() => setOperationsOpen(false)}
                  >
                    <div className="h-7 w-7 rounded-lg bg-[#93ccff]/10 border border-[#93ccff]/20 text-[#93ccff] flex items-center justify-center shrink-0">
                      <ArrowDownLeft className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#dae2fd]">Receipts</div>
                      <div className="text-[10px] text-[#94a3b8]">Inbound supplier shipments</div>
                    </div>
                  </Link>

                  <Link
                    href="/deliveries"
                    className="flex items-center gap-3 p-2 rounded-lg text-xs text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#222a3d] transition"
                    onClick={() => setOperationsOpen(false)}
                  >
                    <div className="h-7 w-7 rounded-lg bg-[#ffc174]/10 border border-[#ffc174]/20 text-[#ffc174] flex items-center justify-center shrink-0">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#dae2fd]">Deliveries</div>
                      <div className="text-[10px] text-[#94a3b8]">Outbound customer dispatches</div>
                    </div>
                  </Link>

                  <Link
                    href="/transfers"
                    className="flex items-center gap-3 p-2 rounded-lg text-xs text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#222a3d] transition"
                    onClick={() => setOperationsOpen(false)}
                  >
                    <div className="h-7 w-7 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center shrink-0">
                      <ArrowLeftRight className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#dae2fd]">Internal Transfers</div>
                      <div className="text-[10px] text-[#94a3b8]">Inter-warehouse stock relocation</div>
                    </div>
                  </Link>

                  <div className="my-1 border-t border-[#2d3449]/60" />

                  <Link
                    href="/adjustments/new"
                    className="flex items-center gap-3 p-2 rounded-lg text-xs text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#222a3d] transition"
                    onClick={() => setOperationsOpen(false)}
                  >
                    <div className="h-7 w-7 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-[#ffb4ab] flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#dae2fd]">Stock Adjustments</div>
                      <div className="text-[10px] text-[#94a3b8]">Physical count audit diffs</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/products"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive('/products')
                  ? 'bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/25 font-semibold'
                  : 'text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#171f33]'
              }`}
            >
              Stock Catalog
            </Link>

            <Link
              href="/history"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive('/history')
                  ? 'bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/25 font-semibold'
                  : 'text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#171f33]'
              }`}
            >
              Move History
            </Link>

            <Link
              href="/settings/warehouses"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive('/settings')
                  ? 'bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/25 font-semibold'
                  : 'text-[#94a3b8] hover:text-[#dae2fd] hover:bg-[#171f33]'
              }`}
            >
              Settings
            </Link>
          </nav>

          {/* Right: Profile / Auth */}
          <div className="flex items-center gap-3" ref={profileRef}>
            {status === 'loading' ? (
              <div className="h-8 w-8 rounded-full bg-[#131b2e] animate-pulse" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg bg-[#131b2e] border border-[#2d3449]/80 hover:border-[#ffc174]/40 transition-colors cursor-pointer text-left"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#ffc174] to-[#f59e0b] flex items-center justify-center text-[#090D16] text-xs font-bold shadow-inner shrink-0">
                    {session.user.name
                      ? session.user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'U'}
                  </div>
                  <div className="hidden sm:block text-left text-xs">
                    <div className="font-medium text-[#dae2fd] flex items-center gap-1 leading-tight">
                      <span>{session.user.name || session.user.email}</span>
                      <ShieldCheck className="h-3 w-3 text-[#ffc174]" />
                    </div>
                    <div className="text-[10px] text-[#94a3b8] leading-tight mt-0.5">
                      {(session.user as any).role === 'INVENTORY_MANAGER'
                        ? 'Inventory Manager'
                        : (session.user as any).role || 'Main DC'}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8] hidden sm:block ml-0.5" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#131b2e] border border-[#2d3449] shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-[#2d3449]/80 mb-1">
                      <div className="text-xs font-semibold text-[#dae2fd] truncate">
                        {session.user.name || 'User'}
                      </div>
                      <div className="text-[11px] text-[#94a3b8] truncate font-mono">
                        {session.user.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ffc174] text-[#090D16] text-xs font-bold hover:bg-[#ffc174]/90 transition-colors shadow-sm"
              >
                <User className="h-3.5 w-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

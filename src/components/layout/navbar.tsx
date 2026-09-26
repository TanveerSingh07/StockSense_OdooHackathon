'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const [operationsOpen, setOperationsOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-gray-950">
              <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black shadow-sm">
                S
              </span>
              <span>StockSense</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md transition ${
                  isActive('/') && pathname === '/'
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                  className={`flex items-center gap-1 px-3 py-2 rounded-md transition ${
                    pathname.startsWith('/receipts') ||
                    pathname.startsWith('/deliveries') ||
                    pathname.startsWith('/adjustments')
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Operations
                  <svg
                    className={`w-4 h-4 transition-transform ${operationsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {operationsOpen && (
                  <div className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/receipts"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                      onClick={() => setOperationsOpen(false)}
                    >
                      <span className="h-6 w-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        ↓
                      </span>
                      <div>
                        <div className="font-semibold">Receipts</div>
                        <div className="text-[11px] text-gray-500">Inbound supplier shipments</div>
                      </div>
                    </Link>

                    <Link
                      href="/deliveries"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                      onClick={() => setOperationsOpen(false)}
                    >
                      <span className="h-6 w-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        ↑
                      </span>
                      <div>
                        <div className="font-semibold">Deliveries</div>
                        <div className="text-[11px] text-gray-500">Outbound customer dispatches</div>
                      </div>
                    </Link>

                    <Link
                      href="/adjustments/new"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition border-t border-gray-100"
                      onClick={() => setOperationsOpen(false)}
                    >
                      <span className="h-6 w-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                        ⚖
                      </span>
                      <div>
                        <div className="font-semibold">Stock Adjustments</div>
                        <div className="text-[11px] text-gray-500">Physical inventory reconciliation</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/products"
                className={`px-3 py-2 rounded-md transition ${
                  isActive('/products')
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Stock Catalog
              </Link>

              <Link
                href="/history"
                className={`px-3 py-2 rounded-md transition ${
                  isActive('/history')
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Move History
              </Link>

              <Link
                href="/settings/warehouses"
                className={`px-3 py-2 rounded-md transition ${
                  isActive('/settings')
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Settings
              </Link>
            </nav>
          </div>

          {/* Right side Profile & Quick Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <span className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                IM
              </span>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-semibold text-gray-900">Inventory Manager</div>
                <div className="text-[11px] text-gray-400">Main Warehouse</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

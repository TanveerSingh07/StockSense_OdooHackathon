"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  LayoutDashboard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  SlidersHorizontal, 
  History,
  Boxes,
  Menu,
  X,
  ChevronDown,
  ShieldCheck
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
}

export function OperationsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard, 
      disabled: true 
    },
    { 
      name: "Products", 
      href: "/products", 
      icon: Package, 
      active: pathname.startsWith("/products"),
      badge: "LIVE"
    },
    { 
      name: "Receipts", 
      href: "/receipts", 
      icon: ArrowDownLeft, 
      disabled: true 
    },
    { 
      name: "Deliveries", 
      href: "/deliveries", 
      icon: ArrowUpRight, 
      disabled: true 
    },
    { 
      name: "Transfers", 
      href: "/transfers", 
      icon: ArrowLeftRight, 
      disabled: true 
    },
    { 
      name: "Adjustments", 
      href: "/adjustments", 
      icon: SlidersHorizontal, 
      disabled: true 
    },
    { 
      name: "Move History", 
      href: "/history", 
      icon: History, 
      disabled: true 
    },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#0D1117] text-[#F0F6FC] font-sans antialiased select-none">
      {/* Mobile Top Header */}
      <div className="md:hidden h-14 border-b border-white/[0.08] px-4 flex items-center justify-between bg-[#090C10] z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-500/20">
            <Boxes className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            StockSense
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${mobileMenuOpen ? "flex" : "hidden"} 
        md:flex w-full md:w-60 shrink-0 flex-col border-r border-white/[0.08] bg-[#090C10] relative z-20 transition-all
      `}>
        {/* Brand Header */}
        <div className="hidden md:flex h-16 border-b border-white/[0.08] px-4 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
              <Boxes className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="font-semibold text-[14px] text-white tracking-tight block leading-tight">
                StockSense
              </span>
              <span className="text-[11px] text-slate-400 block">
                Warehouse Operations
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
            v1.0
          </span>
        </div>

        {/* Workspace Quick Selector */}
        <div className="px-3 pt-3 pb-1">
          <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="truncate font-medium">Main Distribution Center</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-2.5 py-2 text-xs text-slate-400/50 rounded-lg cursor-not-allowed group"
                  title="Coming in next sprint"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 opacity-40 group-hover:opacity-60 transition-opacity" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400/40 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.04]">
                    SOON
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-semibold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-white/[0.08] bg-[#090C10]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-colors cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-inner">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-white truncate flex items-center gap-1">
                  <span>Admin User</span>
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  ops@stocksense.io
                </div>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-400" title="Online" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0D1117] overflow-hidden relative z-10">
        {children}
      </main>
    </div>
  );
}

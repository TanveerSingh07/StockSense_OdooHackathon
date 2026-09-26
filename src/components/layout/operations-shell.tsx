"use client";

import React from "react";
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
  Boxes
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

  const navItems: NavItem[] = [
    { 
      name: "Products", 
      href: "/products", 
      icon: Package, 
      active: pathname.startsWith("/products"),
      badge: "ACTIVE"
    },
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard, 
      disabled: true 
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#101312] text-[#E7ECE7] font-sans antialiased select-none">
      {/* Sidebar / Left Navigation Console */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-[#2C332E] bg-[#101312]">
        {/* Console Brand Header */}
        <div className="h-14 border-b border-[#2C332E] px-4 flex items-center justify-between bg-[#141816]">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-[#E8A33D]" />
            <span className="font-sans text-xs font-black tracking-widest text-[#E7ECE7] uppercase">
              STOCKSENSE
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#E8A33D] bg-[#E8A33D]/10 px-1.5 py-0.5 rounded-[2px] border border-[#E8A33D]/20">
            v1.0
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#9AA69C]/60">
            Catalog & Ops
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-2.5 py-2 text-[14px] text-[#9AA69C]/40 rounded-[3px] cursor-not-allowed"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 opacity-50" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#9AA69C]/30 uppercase">Soon</span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-2.5 py-2 text-[14px] rounded-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-[#E8A33D] ${
                  isActive
                    ? "bg-[#20251F] text-[#E8A33D] font-semibold border-l-2 border-[#E8A33D]"
                    : "text-[#9AA69C] hover:text-[#E7ECE7] hover:bg-[#181C1A]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#E8A33D]" : "text-[#9AA69C]"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono font-bold bg-[#E8A33D]/15 text-[#E8A33D] px-1.5 py-0.5 rounded-[2px]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Terminal / Warehouse Station Info Footer */}
        <div className="p-3 border-t border-[#2C332E] bg-[#141816] text-[11px] font-mono text-[#9AA69C] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9AA69C]/70">STATION:</span>
            <span className="text-[#E7ECE7] text-[11px]">CONSOLE-01</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9AA69C]/70">SYS STATUS:</span>
            <span className="flex items-center gap-1.5 text-[#6FA66A] text-[11px]">
              {/* Slow 2s ambient opacity pulse */}
              <span className="inline-block h-2 w-2 rounded-full bg-[#6FA66A] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></span>
              ONLINE
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#101312] overflow-hidden">
        {children}
      </main>
    </div>
  );
}

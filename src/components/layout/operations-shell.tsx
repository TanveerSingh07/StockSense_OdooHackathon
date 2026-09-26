"use client";

import React, { useState, useEffect } from "react";
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
  X
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
  const [time, setTime] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#1C1B18] text-[#EDEAE3] font-sans antialiased select-none relative">
      {/* 1px Repeating Diagonal Hairline Pattern Background */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-25"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #3A3733 0, #3A3733 1px, transparent 0, transparent 14px)`
        }}
      />

      {/* Mobile Top Navbar with Hamburger */}
      <div className="md:hidden h-14 border-b border-[#3A3733] px-4 flex items-center justify-between bg-[#242320] z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-[2px] bg-[#F2B705] text-[#1C1B18] flex items-center justify-center font-bold">
            <Boxes className="h-4 w-4 stroke-[2.5]" />
          </div>
          <span className="font-sans text-[14px] font-bold tracking-wider text-[#EDEAE3] uppercase">
            STOCKSENSE
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#938E83] hover:text-[#EDEAE3] focus:outline-none"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar (Desktop persistent, Mobile drawer) */}
      <aside className={`
        ${mobileMenuOpen ? "flex" : "hidden"} 
        md:flex w-full md:w-56 shrink-0 flex-col border-r border-[#3A3733] bg-[#242320] relative z-20 transition-all
      `}>
        {/* Console Brand Header (Desktop) */}
        <div className="hidden md:flex h-16 border-b border-[#3A3733] px-4 items-center justify-between bg-[#242320]">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-[2px] bg-[#F2B705] text-[#1C1B18] flex items-center justify-center font-bold">
              <Boxes className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-sans text-[13px] font-bold tracking-widest text-[#EDEAE3] uppercase block leading-none">
                STOCKSENSE
              </span>
              <span className="text-[10px] font-mono text-[#938E83] tracking-widest block mt-1">
                WAREHOUSE OS
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] font-bold text-[#F2B705] bg-[#F2B705]/10 px-1.5 py-0.5 rounded-[2px] border border-[#F2B705]/25">
            v1.0
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          <div className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-widest text-[#938E83]">
            MENU
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-2.5 py-2 text-[13.5px] text-[#938E83]/40 rounded-[2px] cursor-not-allowed"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 opacity-40" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#938E83]/30 uppercase">
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
                className={`flex items-center justify-between px-2.5 py-2 text-[13.5px] rounded-[2px] transition-colors focus-visible:outline-2 focus-visible:outline-[#F2B705] ${
                  isActive
                    ? "bg-[#2D2B27] text-[#F2B705] font-semibold border-l-2 border-[#F2B705]"
                    : "text-[#938E83] hover:text-[#EDEAE3] hover:bg-[#2D2B27]/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#F2B705]" : "text-[#938E83]"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono font-bold bg-[#F2B705] text-[#1C1B18] px-1 py-0.2 rounded-[2px]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Terminal Station Telemetry Status Strip */}
        <div className="p-3 border-t border-[#3A3733] bg-[#242320] text-[11px] font-mono text-[#938E83] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#938E83] uppercase">LOCAL TIME:</span>
            <span className="text-[#EDEAE3] font-mono text-[11px] font-semibold tracking-wider">
              {time || "12:00:00"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#938E83] uppercase">WORKSTATION:</span>
            <span className="text-[#EDEAE3] text-[11px]">CONSOLE-01</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#3A3733]">
            <span className="text-[10px] text-[#938E83] uppercase">STATUS:</span>
            <span className="flex items-center gap-1.5 text-[#5C9A63] text-[11px] font-bold">
              <span className="inline-block h-2 w-2 rounded-full bg-[#5C9A63] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></span>
              CONNECTED
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden relative z-10">
        {children}
      </main>
    </div>
  );
}

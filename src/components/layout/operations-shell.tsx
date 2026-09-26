"use client";

import React from "react";

export function OperationsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0F172A] text-slate-100">
      {children}
    </div>
  );
}

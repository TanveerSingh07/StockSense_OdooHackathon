"use client";

import React from "react";

export function OperationsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F14] text-[#F0F6FC]">
      {children}
    </div>
  );
}

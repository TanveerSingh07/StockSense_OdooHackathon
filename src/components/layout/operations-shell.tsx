"use client";

import React from "react";

export function OperationsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0b1326] text-[#dae2fd]">
      {children}
    </div>
  );
}

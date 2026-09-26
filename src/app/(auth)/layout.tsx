import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StockSense — Sign In",
};

// Auth pages get no Navbar — clean, full-screen layout
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

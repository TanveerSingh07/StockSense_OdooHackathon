"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { Eye, EyeOff, Boxes, LogIn, AlertCircle } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");
  const [serverError, setServerError] = useState(
    urlError ? "Invalid email or password. Please try again." : ""
  );
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError("");
    try {
      const res = await signIn("credentials", {
        email: data.email.trim(),
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (!res || res.error || !res.ok) {
        setServerError("Invalid email or password. Please try again.");
        return;
      }

      window.location.href = callbackUrl;
    } catch {
      setServerError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b1326",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255,193,116,0.06) 0%, transparent 60%)",
    }}>
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Brand */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", background: "#131b2e", border: "1px solid rgba(255,193,116,0.3)", borderRadius: "14px", marginBottom: "16px", boxShadow: "0 0 24px rgba(255,193,116,0.08)" }}>
            <Boxes style={{ width: "24px", height: "24px", color: "#ffc174" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: "24px", fontWeight: 700, color: "#dae2fd", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
            Sign in to StockSense Operations Center
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "#131b2e", border: "1px solid rgba(45,52,73,0.8)", borderRadius: "16px", padding: "28px", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* Server Error */}
            {serverError && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "8px",
                }}
              >
                <AlertCircle style={{ width: "16px", height: "16px", color: "#f87171", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#fca5a5", fontWeight: 600, fontFamily: "var(--font-geist-sans), sans-serif" }}>
                  {serverError}
                </span>
              </div>
            )}

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="email" style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-geist-mono), monospace" }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email", {
                  onChange: () => { if (serverError) setServerError(""); }
                })}
                style={{ width: "100%", height: "40px", padding: "0 12px", background: "#0b1326", border: `1px solid ${errors.email ? "rgba(255,180,171,0.5)" : "rgba(45,52,73,0.8)"}`, borderRadius: "8px", color: "#dae2fd", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-geist-sans), sans-serif" }}
                onFocus={(e) => { e.target.style.borderColor = "#ffc174"; e.target.style.boxShadow = "0 0 0 3px rgba(255,193,116,0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = errors.email ? "rgba(255,180,171,0.5)" : "rgba(45,52,73,0.8)"; e.target.style.boxShadow = "none"; }}
              />
              {errors.email && <span style={{ fontSize: "11px", color: "#ffb4ab", fontFamily: "var(--font-geist-mono), monospace" }}>{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label htmlFor="password" style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-geist-mono), monospace" }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: "11px", color: "#ffc174", textDecoration: "none", fontFamily: "var(--font-geist-mono), monospace" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password", {
                    onChange: () => { if (serverError) setServerError(""); }
                  })}
                  style={{ width: "100%", height: "40px", padding: "0 42px 0 12px", background: "#0b1326", border: `1px solid ${errors.password ? "rgba(255,180,171,0.5)" : "rgba(45,52,73,0.8)"}`, borderRadius: "8px", color: "#dae2fd", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-geist-sans), sans-serif" }}
                  onFocus={(e) => { e.target.style.borderColor = "#ffc174"; e.target.style.boxShadow = "0 0 0 3px rgba(255,193,116,0.08)"; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.password ? "rgba(255,180,171,0.5)" : "rgba(45,52,73,0.8)"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword((prev) => !prev);
                  }}
                  style={{
                    position: "absolute",
                    right: "0px",
                    top: "0px",
                    bottom: "0px",
                    width: "40px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: showPassword ? "#ffc174" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                </button>
              </div>
              {errors.password && <span style={{ fontSize: "11px", color: "#ffb4ab", fontFamily: "var(--font-geist-mono), monospace" }}>{errors.password.message}</span>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ width: "100%", height: "42px", background: isSubmitting ? "rgba(255,193,116,0.5)" : "#ffc174", color: "#090D16", borderRadius: "9px", border: "none", fontSize: "13px", fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", transition: "all 0.15s", fontFamily: "var(--font-geist-sans), sans-serif", letterSpacing: "-0.01em" }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ width: "14px", height: "14px", border: "2px solid rgba(9,13,22,0.3)", borderTopColor: "#090D16", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn style={{ width: "15px", height: "15px" }} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", margin: 0 }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "#ffc174", fontWeight: 600, textDecoration: "none" }}>
            Create account
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b1326]" />}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { signupSchema, type SignupInput } from "@/lib/validation/auth";
import { Eye, EyeOff, Boxes, UserPlus, AlertCircle, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onInvalid = (fieldErrors: any) => {
    const firstErr = Object.values(fieldErrors)[0] as any;
    if (firstErr?.message) {
      setServerError(firstErr.message);
    }
  };

  const onSubmit = async (data: SignupInput) => {
    setServerError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          password: data.password,
        }),
      });

      const text = await res.text();
      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = {};
      }

      if (!res.ok) {
        let msg = result?.error || "Unable to create account. Please try again.";
        if (result?.details) {
          const detailMsgs = Object.values(result.details).flat().filter(Boolean);
          if (detailMsgs.length > 0) {
            msg = detailMsgs.join(". ");
          }
        }
        setServerError(msg);
        return;
      }

      setSuccess(true);

      // Automatically sign in the user
      try {
        const signinRes = await signIn("credentials", {
          email: data.email.trim(),
          password: data.password,
          redirect: false,
          callbackUrl: "/",
        });

        if (signinRes?.ok && !signinRes.error) {
          window.location.href = "/";
          return;
        }
      } catch {
        // Fallback to login page if auto-login fails
      }

      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch {
      setServerError("Unable to connect to the server. Please try again.");
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
            Create your account
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
            Join StockSense to manage your warehouse operations
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "#131b2e", border: "1px solid rgba(45,52,73,0.8)", borderRadius: "16px", padding: "28px", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}>

          {success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "16px 0", textAlign: "center" }}>
              <CheckCircle style={{ width: "40px", height: "40px", color: "#10b981" }} />
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#dae2fd", margin: 0 }}>Account created successfully!</p>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Logging you in and redirecting to dashboard…</p>
              <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,193,116,0.3)", borderTopColor: "#ffc174", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite", marginTop: "8px" }} />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Server Error Alert */}
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

              {/* Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="name" style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-geist-mono), monospace" }}>Full Name</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Smith"
                  {...register("name", {
                    onChange: () => { if (serverError) setServerError(""); }
                  })}
                  style={{ width: "100%", height: "40px", padding: "0 12px", background: "#0b1326", border: `1px solid ${errors.name ? "rgba(255,180,171,0.5)" : "rgba(45,52,73,0.8)"}`, borderRadius: "8px", color: "#dae2fd", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => { e.target.style.borderColor = "#ffc174"; e.target.style.boxShadow = "0 0 0 3px rgba(255,193,116,0.08)"; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.name ? "rgba(255,180,171,0.5)" : "rgba(45,52,73,0.8)"; e.target.style.boxShadow = "none"; }}
                />
                {errors.name && <span style={{ fontSize: "11px", color: "#ffb4ab", fontFamily: "var(--font-geist-mono), monospace" }}>{errors.name.message}</span>}
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="email" style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-geist-mono), monospace" }}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register("email", {
                    onChange: () => { if (serverError) setServerError(""); }
                  })}
                  style={{ width: "100%", height: "40px", padding: "0 12px", background: "#0b1326", border: `1px solid ${errors.email ? "rgba(255,180,171,0.5)" : "rgba(45,52,73,0.8)"}`, borderRadius: "8px", color: "#dae2fd", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
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
                  <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "var(--font-geist-mono), monospace" }}>
                    Min. 8 characters
                  </span>
                </div>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    {...register("password", {
                      onChange: () => { if (serverError) setServerError(""); }
                    })}
                    style={{ width: "100%", height: "40px", padding: "0 42px 0 12px", background: "#0b1326", border: `1px solid ${errors.password ? "rgba(255,180,171,0.5)" : "rgba(45,52,73,0.8)"}`, borderRadius: "8px", color: "#dae2fd", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
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

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ width: "100%", height: "42px", background: isSubmitting ? "rgba(255,193,116,0.5)" : "#ffc174", color: "#090D16", borderRadius: "9px", border: "none", fontSize: "13px", fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", transition: "all 0.15s" }}
              >
                {isSubmitting ? (
                  <>
                    <span style={{ width: "14px", height: "14px", border: "2px solid rgba(9,13,22,0.3)", borderTopColor: "#090D16", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Creating account…
                  </>
                ) : (
                  <>
                    <UserPlus style={{ width: "15px", height: "15px" }} />
                    Create Account
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", margin: 0 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#ffc174", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

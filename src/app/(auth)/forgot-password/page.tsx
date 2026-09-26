"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"request" | "reset">(
    "request"
  );

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [devOtp, setDevOtp] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    setMessage("");
    setError("");
    setDevOtp(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const text = await response.text();

      let body: any = {};

      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          setError(
            "Server returned an invalid response."
          );
          return;
        }
      }

      if (!response.ok) {
        setError(
          body?.error ||
            "Unable to send OTP. Please try again."
        );
        return;
      }

      setMessage(
        body?.message ||
          "If that email exists, an OTP was sent."
      );

      setDevOtp(body?.devOtp ?? null);

      setStep("reset");
    } catch (error) {
      console.error("OTP request failed:", error);

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setMessage("");
    setError("");

    if (!code.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code: code.trim(),
            newPassword,
          }),
        }
      );

      const text = await response.text();

      let body: any = {};

      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          setError(
            "Server returned an invalid response."
          );
          return;
        }
      }

      if (!response.ok) {
        setError(
          body?.error ||
            "Unable to reset password."
        );
        return;
      }

      /*
       * Password reset successful.
       */
      router.push("/login");
    } catch (error) {
      console.error(
        "Password reset failed:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">
          Reset password
        </h1>

        {step === "request" && (
          <>
            <div className="space-y-1">
              <Label htmlFor="email">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              className="w-full"
              onClick={requestOtp}
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send OTP"}
            </Button>
          </>
        )}

        {step === "reset" && (
          <>
            {message && (
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            )}

            {devOtp && (
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                <p>
                  Dev mode — your OTP is:
                </p>

                <strong className="text-lg">
                  {devOtp}
                </strong>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="code">
                OTP Code
              </Label>

              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="newPassword">
                New Password
              </Label>

              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              className="w-full"
              onClick={resetPassword}
              disabled={loading}
            >
              {loading
                ? "Resetting..."
                : "Reset password"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("request");
                setCode("");
                setNewPassword("");
                setMessage("");
                setError("");
                setDevOtp(null);
              }}
            >
              Request New OTP
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
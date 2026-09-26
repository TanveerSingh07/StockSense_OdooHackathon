"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema, LoginInput } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError("");
    const res = await signIn("credentials", {
      ...data,
      redirect: false,
    });
    if (res?.error) {
      setServerError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6"
      >
        <h1 className="text-xl font-semibold">Log in</h1>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-500">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>

        <a href="/forgot-password" className="block text-center text-sm underline">
          Forgot password?
        </a>
      </form>
    </div>
  );
}
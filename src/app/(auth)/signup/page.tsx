"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  signupSchema,
  type SignupInput,
} from "@/lib/validation/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setServerError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      /*
       * Read as text first.
       * This prevents "Unexpected end of JSON input"
       * if the server accidentally returns an empty response.
       */
      const text = await response.text();

      let result: any = {};

      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          console.error("Invalid JSON response from signup API:", text);

          setServerError(
            "Server returned an invalid response. Please try again."
          );

          return;
        }
      }

      if (!response.ok) {
        setServerError(
          result?.error ||
            "Unable to create account. Please try again."
        );

        return;
      }

      /*
       * Signup successful
       */
      router.push("/login");
    } catch (error) {
      console.error("Signup request failed:", error);

      setServerError(
        "Unable to connect to the server. Please try again."
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6"
      >
        <h1 className="text-xl font-semibold">
          Create an account
        </h1>

        {/* Name */}
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>

          <Input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
          />

          {errors.name && (
            <p className="text-sm text-red-500">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>

          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />

          {errors.email && (
            <p className="text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>

          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />

          {errors.password && (
            <p className="text-sm text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">
            {serverError}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Creating account..."
            : "Sign up"}
        </Button>
      </form>
    </div>
  );
}
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),

  code: z
    .string()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export async function POST(req: Request) {
  try {

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      return NextResponse.json(
        {
          error:
            errors.newPassword?.[0] ||
            errors.code?.[0] ||
            errors.email?.[0] ||
            "Invalid reset password data",
        },
        { status: 400 }
      );
    }

    const {
      email,
      code,
      newPassword,
    } = result.data;

    const normalizedEmail = email.trim().toLowerCase();

    const token = await prisma.otpToken.findFirst({
      where: {
        email: normalizedEmail,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        expiresAt: "desc",
      },
    });

    if (!token) {
      return NextResponse.json(
        {
          error: "Invalid or expired OTP",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      12
    );


    await prisma.$transaction([
      prisma.user.update({
        where: {
          email: normalizedEmail,
        },

        data: {
          passwordHash,
        },
      }),

      prisma.otpToken.update({
        where: {
          id: token.id,
        },

        data: {
          used: true,
        },
      }),
    ]);

    return NextResponse.json({
      message: "Password reset successful",
    });
  } catch (error: any) {
    console.error(
      "RESET PASSWORD API ERROR:",
      error
    );

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          error: "User account was not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to reset password. Please try again.",
      },
      { status: 500 }
    );
  }
}
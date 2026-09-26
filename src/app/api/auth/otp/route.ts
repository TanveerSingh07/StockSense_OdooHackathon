import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const otpRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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


    const result = otpRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address",
        },
        { status: 400 }
      );
    }

    const email = result.data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      return NextResponse.json({
        message: "If that email exists, an OTP was sent.",
      });
    }

    const code = generateOtp();

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );


    await prisma.otpToken.updateMany({
      where: {
        email,
        used: false,
      },
      data: {
        used: true,
      },
    });


    await prisma.otpToken.create({
      data: {
        email,
        code,
        expiresAt,
        used: false,
      },
    });

    console.log(
      `[MOCK EMAIL] OTP for ${email}: ${code}`
    );

    return NextResponse.json({
      message: "If that email exists, an OTP was sent.",

      // Only expose OTP during development
      ...(process.env.NODE_ENV !== "production"
        ? { devOtp: code }
        : {}),
    });
  } catch (error) {
    console.error("OTP API ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to generate OTP. Please try again.",
      },
      { status: 500 }
    );
  }
}
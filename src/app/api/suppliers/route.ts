import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Supplier name is required" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create supplier" },
      { status: 500 }
    );
  }
}

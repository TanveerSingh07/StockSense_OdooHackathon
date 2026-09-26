import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: warehouses });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch warehouses" },
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
        { success: false, message: "Warehouse name is required" },
        { status: 400 }
      );
    }

    const warehouse = await prisma.warehouse.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, data: warehouse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create warehouse" },
      { status: 500 }
    );
  }
}
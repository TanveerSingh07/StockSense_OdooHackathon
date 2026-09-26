import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Warehouse name is required" },
      { status: 400 }
    );
  }

  const warehouse = await prisma.warehouse.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(warehouse);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.warehouse.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
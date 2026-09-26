import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const transfers = await prisma.internalTransfer.findMany({
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    });

    const warehouseIds = [
      ...new Set(transfers.flatMap((t) => [t.fromWarehouse, t.toWarehouse])),
    ];
    const productIds = [
      ...new Set(transfers.flatMap((t) => t.lines.map((l) => l.productId))),
    ];

    const [warehouses, products] = await Promise.all([
      prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } }),
      prisma.product.findMany({ where: { id: { in: productIds } } }),
    ]);

    const warehouseMap = new Map(warehouses.map((w) => [w.id, w.name]));
    const productMap = new Map(products.map((p) => [p.id, p]));

    const data = transfers.map((t) => ({
      ...t,
      fromWarehouseName: warehouseMap.get(t.fromWarehouse) || "Unknown",
      toWarehouseName: warehouseMap.get(t.toWarehouse) || "Unknown",
      lines: t.lines.map((l) => ({
        ...l,
        productName: productMap.get(l.productId)?.name || "Unknown",
        productSku: productMap.get(l.productId)?.sku || "",
      })),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromWarehouse, toWarehouse, lines } = body;

    if (!fromWarehouse || !toWarehouse) {
      return NextResponse.json(
        { success: false, message: "Source and destination warehouses are required" },
        { status: 400 }
      );
    }

    if (fromWarehouse === toWarehouse) {
      return NextResponse.json(
        { success: false, message: "Source and destination warehouses must be different" },
        { status: 400 }
      );
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one product line is required" },
        { status: 400 }
      );
    }

    for (const line of lines) {
      if (!line.productId || !line.quantity || line.quantity <= 0) {
        return NextResponse.json(
          { success: false, message: "Each line needs a product and a positive quantity" },
          { status: 400 }
        );
      }
    }

    const transfer = await prisma.internalTransfer.create({
      data: {
        fromWarehouse,
        toWarehouse,
        status: "DRAFT",
        lines: {
          create: lines.map((l: any) => ({
            productId: l.productId,
            quantity: Number(l.quantity),
          })),
        },
      },
      include: { lines: true },
    });

    return NextResponse.json({ success: true, data: transfer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create transfer" },
      { status: 500 }
    );
  }
}
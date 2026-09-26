import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { increaseStock, decreaseStock } from "@/lib/stock-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const transfer = await prisma.internalTransfer.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!transfer) {
      return NextResponse.json(
        { success: false, message: "Transfer not found" },
        { status: 404 }
      );
    }

    if (transfer.status === "DONE") {
      return NextResponse.json(
        { success: false, message: "Transfer already validated" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const line of transfer.lines) {
        await decreaseStock(
          {
            productId: line.productId,
            warehouseId: transfer.fromWarehouse,
            quantity: line.quantity,
            reason: "TRANSFER_OUT",
            refId: transfer.id,
          },
          tx
        );
        await increaseStock(
          {
            productId: line.productId,
            warehouseId: transfer.toWarehouse,
            quantity: line.quantity,
            reason: "TRANSFER_IN",
            refId: transfer.id,
          },
          tx
        );
      }

      await tx.internalTransfer.update({
        where: { id },
        data: { status: "DONE" },
      });
    });

    return NextResponse.json({ success: true, message: "Transfer validated" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to validate transfer" },
      { status: 500 }
    );
  }
}
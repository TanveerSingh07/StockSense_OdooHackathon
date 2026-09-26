import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { increaseStock } from '@/lib/stock-engine';
import { formatReference } from '@/lib/reference';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const [receipt, warehouses, allReceipts] = await Promise.all([
      prisma.receipt.findUnique({
        where: { id: params.id },
        include: { supplier: true, lines: true },
      }),
      prisma.warehouse.findMany(),
      prisma.receipt.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
    ]);

    if (!receipt) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }

    const warehouse = warehouses.find(w => w.id === receipt.warehouseId);
    const index = allReceipts.findIndex(r => r.id === receipt.id);
    const reference = formatReference(warehouse?.name || 'WH', 'IN', index >= 0 ? index + 1 : 1);

    const productIds = receipt.lines.map(l => l.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    const enrichedLines = receipt.lines.map(line => {
      const product = productMap.get(line.productId);
      return {
        ...line,
        product: product || { id: line.productId, name: 'Unknown Product', sku: 'N/A', unit: 'Units' },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...receipt,
        reference,
        warehouseName: warehouse?.name || receipt.warehouseId,
        lines: enrichedLines,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { status } = await req.json();
    const receiptId = params.id;

    if (status !== 'DONE') {
      return NextResponse.json({ success: false, error: 'Only state transitions to DONE are supported' }, { status: 400 });
    }

    // Wrap in a transaction to ensure stock ledger and receipt status update together atomically
    const updated = await prisma.$transaction(async (tx: any) => {
      const receipt = await tx.receipt.findUnique({
        where: { id: receiptId },
        include: { lines: true },
      });

      if (!receipt) throw new Error('Receipt not found');
      if (receipt.status === 'DONE') throw new Error('Receipt already validated');

      // 1. Update stock using the engine for each line
      for (const line of receipt.lines) {
        await increaseStock(
          {
            productId: line.productId,
            warehouseId: receipt.warehouseId,
            quantity: line.quantity,
            reason: 'RECEIPT',
            refId: receipt.id,
          },
          tx
        );
      }

      // 2. Mark receipt as DONE
      return tx.receipt.update({
        where: { id: receiptId },
        data: { status: 'DONE' },
        include: { lines: true, supplier: true },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

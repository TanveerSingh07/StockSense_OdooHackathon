import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { increaseStock } from '@/lib/stock-engine';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: params.id },
    include: { supplier: true, lines: true }
  });
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(receipt);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const receiptId = params.id;

    if (status !== 'DONE') {
       return NextResponse.json({ error: 'Only state transitions to DONE are supported' }, { status: 400 });
    }

    // Wrap in a transaction to ensure stock ledger and receipt status update together atomically
    const updated = await prisma.$transaction(async (tx: any) => {
      const receipt = await tx.receipt.findUnique({
        where: { id: receiptId },
        include: { lines: true }
      });

      if (!receipt) throw new Error('Receipt not found');
      if (receipt.status === 'DONE') throw new Error('Already validated');

      // 1. Update stock using the engine for each line
      for (const line of receipt.lines) {
        await increaseStock({
          productId: line.productId,
          warehouseId: receipt.warehouseId,
          quantity: line.quantity,
          reason: 'RECEIPT',
          refId: receipt.id
        }, tx);
      }

      // 2. Mark receipt as DONE
      return tx.receipt.update({
        where: { id: receiptId },
        data: { status: 'DONE' },
        include: { lines: true }
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

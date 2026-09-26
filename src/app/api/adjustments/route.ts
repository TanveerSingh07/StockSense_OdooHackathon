import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mutateStock } from '@/lib/stock-engine';

export async function POST(req: Request) {
  try {
    const { productId, warehouseId, change } = await req.json();
    
    if (!productId || !warehouseId || change === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (change === 0) {
      return NextResponse.json({ error: 'Change cannot be zero' }, { status: 400 });
    }

    // Generate reference ID like ADJ/001 (mock logic)
    const refId = `ADJ/${Date.now().toString().slice(-6)}`;

    // Wrap the mutation in a Prisma transaction
    await prisma.$transaction(async (tx) => {
      await mutateStock({
        productId,
        warehouseId,
        quantity: Number(change),
        reason: 'ADJUSTMENT',
        refId
      }, tx);
    });

    return NextResponse.json({ success: true, refId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

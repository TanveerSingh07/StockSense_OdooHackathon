import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const receipts = await prisma.receipt.findMany({
    include: { supplier: true, lines: true },
    orderBy: { id: 'desc' }
  });
  return NextResponse.json(receipts);
}

export async function POST(req: Request) {
  try {
    const { supplierId, warehouseId, lines } = await req.json();
    
    // Minimal validation
    if (!supplierId || !warehouseId || !lines?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const receipt = await prisma.receipt.create({
      data: {
        supplierId,
        warehouseId,
        status: 'DRAFT',
        lines: {
          create: lines.map((l: any) => ({
            productId: l.productId,
            quantity: Number(l.quantity)
          }))
        }
      },
      include: { lines: true }
    });

    return NextResponse.json(receipt);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

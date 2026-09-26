import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decreaseStock } from '@/lib/stock-engine';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const delivery = await prisma.deliveryOrder.findUnique({
    where: { id: params.id },
    include: { lines: true }
  });
  if (!delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(delivery);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const deliveryId = params.id;

    if (status !== 'DONE') {
       return NextResponse.json({ error: 'Only state transitions to DONE are supported' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const delivery = await tx.deliveryOrder.findUnique({
        where: { id: deliveryId },
        include: { lines: true }
      });

      if (!delivery) throw new Error('Delivery Order not found');
      if (delivery.status === 'DONE') throw new Error('Already validated');

      // 1. Decrease stock (will throw if insufficient due to our stock-engine logic)
      for (const line of delivery.lines) {
        await decreaseStock({
          productId: line.productId,
          warehouseId: delivery.warehouseId,
          quantity: line.quantity,
          reason: 'DELIVERY',
          refId: delivery.id
        }, tx);
      }

      // 2. Mark delivery as DONE
      return tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: { status: 'DONE' },
        include: { lines: true }
      });
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

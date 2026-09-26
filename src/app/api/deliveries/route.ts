import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const deliveries = await prisma.deliveryOrder.findMany({
    include: { lines: true },
    orderBy: { id: 'desc' }
  });
  return NextResponse.json(deliveries);
}

export async function POST(req: Request) {
  try {
    const { customer, warehouseId, lines } = await req.json();
    
    if (!customer || !warehouseId || !lines?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const delivery = await prisma.deliveryOrder.create({
      data: {
        customer,
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

    return NextResponse.json(delivery);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

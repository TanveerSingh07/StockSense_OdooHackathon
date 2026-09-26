import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatReference } from '@/lib/reference';

export async function GET() {
  try {
    const [deliveries, warehouses, products, stockLevels] = await Promise.all([
      prisma.deliveryOrder.findMany({
        include: { lines: true },
        orderBy: { id: 'asc' }, // Sequence order
      }),
      prisma.warehouse.findMany(),
      prisma.product.findMany(),
      prisma.stockLevel.findMany(),
    ]);

    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
    const productMap = new Map(products.map(p => [p.id, p]));
    
    // Quick stock lookup key: `${productId}_${warehouseId}`
    const stockMap = new Map(stockLevels.map(s => [`${s.productId}_${s.warehouseId}`, s.quantity]));

    const enrichedDeliveries = deliveries.map((d, index) => {
      const warehouse = warehouseMap.get(d.warehouseId);
      const reference = formatReference(warehouse?.name || 'WH', 'OUT', index + 1);

      let hasInsufficientStock = false;
      const lines = d.lines.map(line => {
        const product = productMap.get(line.productId);
        const availableStock = stockMap.get(`${line.productId}_${d.warehouseId}`) || 0;
        const isSufficient = availableStock >= line.quantity;
        if (!isSufficient) {
          hasInsufficientStock = true;
        }

        return {
          ...line,
          product: product || { id: line.productId, name: 'Unknown Product', sku: 'N/A', unit: 'Units' },
          availableStock,
          isSufficient,
        };
      });

      // Operational status display: DRAFT, WAITING (if stock insufficient and not DONE), READY, DONE
      let displayStatus: string = d.status;
      if (d.status === 'DRAFT') {
        displayStatus = hasInsufficientStock ? 'WAITING' : 'READY';
      }

      return {
        ...d,
        reference,
        warehouseName: warehouse?.name || d.warehouseId,
        hasInsufficientStock,
        displayStatus,
        lines,
      };
    });

    enrichedDeliveries.reverse();
    return NextResponse.json({ success: true, data: enrichedDeliveries });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { customer, warehouseId, lines } = await req.json();
    
    if (!customer || !warehouseId || !lines?.length) {
      return NextResponse.json({ success: false, error: 'Missing required fields (Customer, Warehouse, Lines)' }, { status: 400 });
    }

    const delivery = await prisma.deliveryOrder.create({
      data: {
        customer: customer.trim(),
        warehouseId,
        status: 'DRAFT',
        lines: {
          create: lines.map((l: any) => ({
            productId: l.productId,
            quantity: Number(l.quantity),
          })),
        },
      },
      include: { lines: true },
    });

    return NextResponse.json({ success: true, data: delivery }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

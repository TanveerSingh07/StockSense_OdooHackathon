import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decreaseStock } from '@/lib/stock-engine';
import { formatReference } from '@/lib/reference';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const [delivery, warehouses, allDeliveries] = await Promise.all([
      prisma.deliveryOrder.findUnique({
        where: { id: params.id },
        include: { lines: true },
      }),
      prisma.warehouse.findMany(),
      prisma.deliveryOrder.findMany({ select: { id: true }, orderBy: { id: 'asc' } }),
    ]);

    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery order not found' }, { status: 404 });
    }

    const warehouse = warehouses.find(w => w.id === delivery.warehouseId);
    const index = allDeliveries.findIndex(d => d.id === delivery.id);
    const reference = formatReference(warehouse?.name || 'WH', 'OUT', index >= 0 ? index + 1 : 1);

    const productIds = delivery.lines.map(l => l.productId);
    const [products, stockLevels] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      prisma.stockLevel.findMany({
        where: {
          productId: { in: productIds },
          warehouseId: delivery.warehouseId,
        },
      }),
    ]);

    const productMap = new Map(products.map(p => [p.id, p]));
    const stockMap = new Map(stockLevels.map(s => [s.productId, s.quantity]));

    let hasInsufficientStock = false;
    const enrichedLines = delivery.lines.map(line => {
      const product = productMap.get(line.productId);
      const availableStock = stockMap.get(line.productId) || 0;
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

    let displayStatus: string = delivery.status;
    if (delivery.status === 'DRAFT') {
      displayStatus = hasInsufficientStock ? 'WAITING' : 'READY';
    }

    return NextResponse.json({
      success: true,
      data: {
        ...delivery,
        reference,
        warehouseName: warehouse?.name || delivery.warehouseId,
        hasInsufficientStock,
        displayStatus,
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
    const deliveryId = params.id;

    if (status !== 'DONE') {
      return NextResponse.json({ success: false, error: 'Only state transitions to DONE are supported' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const delivery = await tx.deliveryOrder.findUnique({
        where: { id: deliveryId },
        include: { lines: true },
      });

      if (!delivery) throw new Error('Delivery Order not found');
      if (delivery.status === 'DONE') throw new Error('Delivery order already validated');

      // 1. Strict pre-validation: check stock for EVERY line before modifying anything
      for (const line of delivery.lines) {
        const stockLevel = await tx.stockLevel.findUnique({
          where: {
            productId_warehouseId: {
              productId: line.productId,
              warehouseId: delivery.warehouseId,
            },
          },
        });

        const available = stockLevel?.quantity || 0;
        if (available < line.quantity) {
          const product = await tx.product.findUnique({ where: { id: line.productId } });
          const prodDesc = product ? `[${product.sku}] ${product.name}` : `Product ${line.productId}`;
          throw new Error(
            `Insufficient stock for ${prodDesc} in warehouse. Available: ${available}, Requested: ${line.quantity}. Delivery blocked.`
          );
        }
      }

      // 2. Decrease stock using the engine
      for (const line of delivery.lines) {
        await decreaseStock(
          {
            productId: line.productId,
            warehouseId: delivery.warehouseId,
            quantity: line.quantity,
            reason: 'DELIVERY',
            refId: delivery.id,
          },
          tx
        );
      }

      // 3. Mark delivery as DONE
      return tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: { status: 'DONE' },
        include: { lines: true },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

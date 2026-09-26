import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [ledger, products, warehouses] = await Promise.all([
      prisma.stockLedger.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.product.findMany(),
      prisma.warehouse.findMany(),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

    const enriched = ledger.map((entry) => ({
      ...entry,
      product: productMap.get(entry.productId) || {
        id: entry.productId,
        name: 'Unknown Product',
        sku: 'N/A',
        unit: 'units',
      },
      warehouse: warehouseMap.get(entry.warehouseId) || {
        id: entry.warehouseId,
        name: 'Default Warehouse',
      },
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

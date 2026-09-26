import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatReference } from '@/lib/reference';

export async function GET() {
  try {
    const [receipts, warehouses, products] = await Promise.all([
      prisma.receipt.findMany({
        include: { supplier: true, lines: true },
        orderBy: { id: 'asc' }, // Order asc to determine sequence numbers
      }),
      prisma.warehouse.findMany(),
      prisma.product.findMany(),
    ]);

    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
    const productMap = new Map(products.map(p => [p.id, p]));

    const enrichedReceipts = receipts.map((r, index) => {
      const warehouse = warehouseMap.get(r.warehouseId);
      const reference = formatReference(warehouse?.name || 'WH', 'IN', index + 1);
      const lines = r.lines.map(line => {
        const product = productMap.get(line.productId);
        return {
          ...line,
          product: product || { id: line.productId, name: 'Unknown Product', sku: 'N/A', unit: 'Units' },
        };
      });

      return {
        ...r,
        reference,
        warehouseName: warehouse?.name || r.warehouseId,
        lines,
      };
    });

    // Return newest first
    enrichedReceipts.reverse();
    return NextResponse.json({ success: true, data: enrichedReceipts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { supplierId, supplierName, warehouseId, lines } = await req.json();
    
    let resolvedSupplierId = supplierId;
    if (!resolvedSupplierId && supplierName) {
      // Find or create supplier
      const existing = await prisma.supplier.findFirst({
        where: { name: { equals: supplierName.trim(), mode: 'insensitive' } },
      });
      if (existing) {
        resolvedSupplierId = existing.id;
      } else {
        const created = await prisma.supplier.create({
          data: { name: supplierName.trim() },
        });
        resolvedSupplierId = created.id;
      }
    }

    if (!resolvedSupplierId || !warehouseId || !lines?.length) {
      return NextResponse.json({ success: false, error: 'Missing required fields (Supplier, Warehouse, Lines)' }, { status: 400 });
    }

    const receipt = await prisma.receipt.create({
      data: {
        supplierId: resolvedSupplierId,
        warehouseId,
        status: 'DRAFT',
        lines: {
          create: lines.map((l: any) => ({
            productId: l.productId,
            quantity: Number(l.quantity),
          })),
        },
      },
      include: { lines: true, supplier: true },
    });

    return NextResponse.json({ success: true, data: receipt }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

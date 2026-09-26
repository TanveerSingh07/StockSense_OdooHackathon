import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [products, stockLevels, receipts, deliveries, warehouses, recentMoves] = await Promise.all([
      prisma.product.findMany({
        include: {
          category: true,
          levels: true,
        },
      }),
      prisma.stockLevel.findMany({
        include: { product: true, warehouse: true },
      }),
      prisma.receipt.findMany({
        include: { lines: true, supplier: true },
      }),
      prisma.deliveryOrder.findMany({
        include: { lines: true },
      }),
      prisma.warehouse.findMany(),
      prisma.stockLedger.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Product calculations
    const formattedProducts = products.map((p) => {
      const totalQuantity = (p.levels || []).reduce((sum, lvl) => sum + lvl.quantity, 0);
      const isLowStock = totalQuantity <= p.reorderPoint;
      return {
        ...p,
        totalQuantity,
        isLowStock,
      };
    });

    const lowStockProducts = formattedProducts.filter((p) => p.isLowStock);
    const outOfStockProducts = formattedProducts.filter((p) => p.totalQuantity === 0);
    const healthyProducts = formattedProducts.filter((p) => !p.isLowStock && p.totalQuantity > 0);

    const totalStockUnits = stockLevels.reduce((sum, lvl) => sum + lvl.quantity, 0);
    const pendingReceipts = receipts.filter((r) => r.status === 'DRAFT');
    const pendingDeliveries = deliveries.filter((d) => d.status === 'DRAFT');
    const completedReceipts = receipts.filter((r) => r.status === 'DONE');
    const completedDeliveries = deliveries.filter((d) => d.status === 'DONE');

    const stockMap = new Map(stockLevels.map((s) => [`${s.productId}_${s.warehouseId}`, s.quantity]));
    let waitingDeliveriesCount = 0;
    let readyDeliveriesCount = 0;

    pendingDeliveries.forEach((d) => {
      const hasDeficit = d.lines.some((l) => {
        const available = stockMap.get(`${l.productId}_${d.warehouseId}`) || 0;
        return l.quantity > available;
      });
      if (hasDeficit) {
        waitingDeliveriesCount++;
      } else {
        readyDeliveriesCount++;
      }
    });

    const healthPercentage = formattedProducts.length > 0
      ? Math.round((healthyProducts.length / formattedProducts.length) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalProducts: formattedProducts.length,
          totalStockUnits,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          healthyCount: healthyProducts.length,
          healthPercentage,
          pendingDocuments: {
            receiptsToReceive: pendingReceipts.length,
            deliveriesReady: readyDeliveriesCount,
            deliveriesWaiting: waitingDeliveriesCount,
            totalPending: pendingReceipts.length + pendingDeliveries.length,
          },
          warehousesCount: warehouses.length,
          totalReceiptOperations: receipts.length,
          totalDeliveryOperations: deliveries.length,
        },
        recentActivity: recentMoves,
      },
    });
  } catch (error: any) {
    console.error('Error in Dashboard API:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}

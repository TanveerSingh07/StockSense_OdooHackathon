import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const docType = searchParams.get('docType') || undefined; // 'ALL' | 'RECEIPT' | 'DELIVERY'
    const status = searchParams.get('status') || undefined; // 'ALL' | 'DRAFT' | 'DONE'

    const [categories, warehouses, rawProducts, rawStockLevels, rawReceipts, rawDeliveries, rawRecentMoves] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.warehouse.findMany({ orderBy: { name: 'asc' } }),
      prisma.product.findMany({
        where: categoryId && categoryId !== 'all' ? { categoryId } : undefined,
        include: {
          category: true,
          levels: warehouseId && warehouseId !== 'all' ? { where: { warehouseId } } : true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.stockLevel.findMany({
        where: {
          ...(warehouseId && warehouseId !== 'all' ? { warehouseId } : {}),
          ...(categoryId && categoryId !== 'all' ? { product: { categoryId } } : {}),
        },
        include: { product: { include: { category: true } }, warehouse: true },
        orderBy: { quantity: 'desc' },
      }),
      prisma.receipt.findMany({
        where: {
          ...(warehouseId && warehouseId !== 'all' ? { warehouseId } : {}),
          ...(status && status !== 'all' ? { status: status as 'DRAFT' | 'DONE' } : {}),
        },
        include: { lines: true, supplier: true },
        orderBy: { id: 'desc' },
      }),
      prisma.deliveryOrder.findMany({
        where: {
          ...(warehouseId && warehouseId !== 'all' ? { warehouseId } : {}),
          ...(status && status !== 'all' ? { status: status as 'DRAFT' | 'DONE' } : {}),
        },
        include: { lines: true },
        orderBy: { id: 'desc' },
      }),
      prisma.stockLedger.findMany({
        where: {
          ...(warehouseId && warehouseId !== 'all' ? { warehouseId } : {}),
          ...(docType && docType !== 'all'
            ? docType === 'RECEIPT'
              ? { reason: 'RECEIPT' }
              : docType === 'DELIVERY'
              ? { reason: 'DELIVERY' }
              : {}
            : {}),
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Product calculations
    const formattedProducts = rawProducts.map((p) => {
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

    const totalStockUnits = rawStockLevels.reduce((sum, lvl) => sum + lvl.quantity, 0);
    const pendingReceipts = rawReceipts.filter((r) => r.status === 'DRAFT');
    const pendingDeliveries = rawDeliveries.filter((d) => d.status === 'DRAFT');

    const stockMap = new Map(rawStockLevels.map((s) => [`${s.productId}_${s.warehouseId}`, s.quantity]));
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
      filters: {
        warehouseId: warehouseId || 'all',
        categoryId: categoryId || 'all',
        docType: docType || 'all',
        status: status || 'all',
      },
      metadata: {
        warehouses,
        categories,
      },
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
          totalReceiptOperations: rawReceipts.length,
          totalDeliveryOperations: rawDeliveries.length,
        },
        stockLevels: rawStockLevels.slice(0, 10),
        recentActivity: rawRecentMoves,
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

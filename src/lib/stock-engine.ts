import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export type StockMutationParams = {
  productId: string;
  warehouseId: string;
  quantity: number; // The amount to change (can be positive or negative inside mutateStock)
  reason: 'RECEIPT' | 'DELIVERY' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';
  refId: string;
};

/**
 * Core engine for mutating stock safely. 
 * Always writes to StockLedger for an audit trail and prevents negative stock.
 */
export async function mutateStock(
  params: StockMutationParams,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;

  // 1. Fetch current stock (with an exclusive lock if running in a transaction, typically handled at DB level but Prisma handles basic concurrency via upsert/atomic updates)
  const currentStock = await db.stockLevel.findUnique({
    where: {
      productId_warehouseId: {
        productId: params.productId,
        warehouseId: params.warehouseId,
      },
    },
  });

  const currentQty = currentStock?.quantity || 0;
  const newQty = currentQty + params.quantity;

  // 2. Prevent negative stock
  if (newQty < 0) {
    throw new Error(
      `Insufficient stock for product ${params.productId} in warehouse ${params.warehouseId}. Available: ${currentQty}, Requested: ${Math.abs(params.quantity)}`
    );
  }

  // 3. Update or create stock level
  await db.stockLevel.upsert({
    where: {
      productId_warehouseId: {
        productId: params.productId,
        warehouseId: params.warehouseId,
      },
    },
    update: {
      quantity: newQty,
    },
    create: {
      productId: params.productId,
      warehouseId: params.warehouseId,
      quantity: newQty,
    },
  });

  // 4. Write to ledger for audit
  await db.stockLedger.create({
    data: {
      productId: params.productId,
      warehouseId: params.warehouseId,
      change: params.quantity,
      reason: params.reason,
      refId: params.refId,
    },
  });
}

// Helper wrappers
export async function increaseStock(
  params: Omit<StockMutationParams, 'quantity'> & { quantity: number },
  tx?: Prisma.TransactionClient
) {
  if (params.quantity <= 0) throw new Error('Increase quantity must be greater than zero');
  return mutateStock(params, tx);
}

export async function decreaseStock(
  params: Omit<StockMutationParams, 'quantity'> & { quantity: number },
  tx?: Prisma.TransactionClient
) {
  if (params.quantity <= 0) throw new Error('Decrease quantity must be greater than zero');
  return mutateStock({ ...params, quantity: -params.quantity }, tx);
}

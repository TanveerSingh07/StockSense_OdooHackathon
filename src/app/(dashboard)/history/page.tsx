import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MoveHistoryPage() {
  const [ledger, products, warehouses] = await Promise.all([
    prisma.stockLedger.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.product.findMany(),
    prisma.warehouse.findMany(),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-[#F0F6FC]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Stock Move History</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete audit trail of inventory mutations across receipts, deliveries, and adjustments.
          </p>
        </div>
      </div>

      <div className="border border-white/[0.08] rounded-xl bg-[#161B22] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Reference / Order</th>
                <th className="p-3.5">Product Details</th>
                <th className="p-3.5">Warehouse</th>
                <th className="p-3.5">Operation Type</th>
                <th className="p-3.5 text-right">Quantity Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {ledger.map((entry) => {
                const isIn = entry.change > 0;
                const product = productMap.get(entry.productId);
                const warehouse = warehouseMap.get(entry.warehouseId);

                return (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 text-slate-400 whitespace-nowrap text-[11px] font-mono">
                      {new Date(entry.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 font-mono text-xs font-semibold text-slate-200">
                      {entry.refId}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-white text-xs">{product?.name || entry.productId}</div>
                      <div className="text-[10px] font-mono text-slate-400">{product?.sku || 'N/A'}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {warehouse?.name || entry.warehouseId}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                        {entry.reason}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                          isIn
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isIn ? `+${entry.change}` : entry.change} {product?.unit || 'units'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No stock movements recorded yet. Validate an inbound receipt or outbound delivery to see entries here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

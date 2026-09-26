import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Stock Move History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete audit trail of inventory mutations across receipts, deliveries, and adjustments.
          </p>
        </div>
      </div>

      <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Reference / Order</th>
              <th className="p-4">Product Details</th>
              <th className="p-4">Warehouse</th>
              <th className="p-4">Operation Type</th>
              <th className="p-4 text-right">Quantity Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ledger.map((entry) => {
              const isIn = entry.change > 0;
              const product = productMap.get(entry.productId);
              const warehouse = warehouseMap.get(entry.warehouseId);

              return (
                <tr key={entry.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-4 font-mono text-xs font-bold text-gray-800">
                    {entry.refId}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">{product?.name || entry.productId}</div>
                    <div className="text-xs font-mono text-gray-400">{product?.sku || 'N/A'}</div>
                  </td>
                  <td className="p-4 text-xs font-medium text-gray-600">
                    {warehouse?.name || entry.warehouseId}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      {entry.reason}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {/* Excalidraw Workflow: In events green, Out events red */}
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                        isIn
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
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
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No stock movements recorded yet. Validate an inbound receipt or outbound delivery to see entries here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

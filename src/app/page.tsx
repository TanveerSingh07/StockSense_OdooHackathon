import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatReference } from '@/lib/reference';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [receipts, deliveries, latestMoves, stockLevels, products, warehouses] = await Promise.all([
    prisma.receipt.findMany({ include: { lines: true }, orderBy: { id: 'asc' } }),
    prisma.deliveryOrder.findMany({ include: { lines: true }, orderBy: { id: 'asc' } }),
    prisma.stockLedger.findMany({ take: 6, orderBy: { createdAt: 'desc' } }),
    prisma.stockLevel.findMany({
      include: { product: true, warehouse: true },
      orderBy: { quantity: 'desc' },
      take: 6,
    }),
    prisma.product.findMany(),
    prisma.warehouse.findMany(),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const stockMap = new Map(stockLevels.map((s) => [`${s.productId}_${s.warehouseId}`, s.quantity]));

  // Inbound stats
  const toReceiveCount = receipts.filter((r) => r.status === 'DRAFT').length;
  const totalReceiptOperations = receipts.length;

  // Outbound stats
  let waitingCount = 0;
  let toDeliverCount = 0;
  deliveries.forEach((d) => {
    if (d.status === 'DRAFT') {
      const hasDeficit = d.lines.some((l) => {
        const available = stockMap.get(`${l.productId}_${d.warehouseId}`) || 0;
        return l.quantity > available;
      });
      if (hasDeficit) {
        waitingCount++;
      } else {
        toDeliverCount++;
      }
    }
  });
  const totalDeliveryOperations = deliveries.length;
  const totalItemsInStock = stockLevels.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">StockSense IMS Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time inventory metrics, inbound/outbound logistics, and move ledger.</p>
      </div>

      {/* Operations Overview Cards (Matching Excalidraw Mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Receipts Card */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                Inbound Logistics
              </span>
              <span className="text-xs text-gray-400 font-mono">{totalReceiptOperations} operations</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Receipts</h2>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">To Receive / Ready</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                  {toReceiveCount}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">Total Inbound Operations</span>
                <span className="font-bold text-gray-900 font-mono">{totalReceiptOperations}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Link
              href="/receipts"
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              Open Receipts &rarr;
            </Link>
          </div>
        </div>

        {/* Deliveries Card */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Outbound Logistics
              </span>
              <span className="text-xs text-gray-400 font-mono">{totalDeliveryOperations} operations</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Deliveries</h2>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">Ready to Deliver</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                  {toDeliverCount}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">Waiting for Stock</span>
                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded font-mono">
                  {waitingCount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Link
              href="/deliveries"
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              Open Deliveries &rarr;
            </Link>
          </div>
        </div>

        {/* Inventory Summary Card */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                Stock Catalog
              </span>
              <span className="text-xs text-gray-400 font-mono">{products.length} products</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Inventory Stock</h2>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">Total Units On Hand</span>
                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono">
                  {totalItemsInStock}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100">
                <span className="text-gray-600">Warehouses Active</span>
                <span className="font-bold text-gray-900 font-mono">{warehouses.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <Link
              href="/products"
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              View Stock Catalog &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Operations Quick Action Submenu */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Operations Submenu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/receipts/new"
            className="flex items-center gap-3 p-4 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 rounded-xl transition group"
          >
            <span className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              ↓
            </span>
            <div>
              <div className="font-bold text-blue-950 group-hover:text-blue-700">1. New Receipt</div>
              <div className="text-xs text-blue-800">Incoming vendor stock</div>
            </div>
          </Link>

          <Link
            href="/deliveries/new"
            className="flex items-center gap-3 p-4 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition group"
          >
            <span className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
              ↑
            </span>
            <div>
              <div className="font-bold text-emerald-950 group-hover:text-emerald-700">2. New Delivery</div>
              <div className="text-xs text-emerald-800">Outbound customer dispatch</div>
            </div>
          </Link>

          <Link
            href="/adjustments/new"
            className="flex items-center gap-3 p-4 bg-purple-50/70 hover:bg-purple-100 border border-purple-200 rounded-xl transition group"
          >
            <span className="h-10 w-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
              ⚖
            </span>
            <div>
              <div className="font-bold text-purple-950 group-hover:text-purple-700">3. Stock Adjustment</div>
              <div className="text-xs text-purple-800">Counted vs recorded diffs</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Available Stock & Move History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Stock */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Available Stock</h2>
            <Link href="/products" className="text-xs font-semibold text-blue-600 hover:underline">
              View all products &rarr;
            </Link>
          </div>
          <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Product</th>
                  <th className="p-4">Warehouse</th>
                  <th className="p-4 text-right">On Hand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockLevels.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{s.product?.name || s.productId}</div>
                      <div className="text-xs font-mono text-gray-500">{s.product?.sku}</div>
                    </td>
                    <td className="p-4 text-xs text-gray-600">{s.warehouse?.name || s.warehouseId}</td>
                    <td className="p-4 text-right font-mono font-bold text-base text-gray-900">{s.quantity}</td>
                  </tr>
                ))}
                {stockLevels.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">
                      No stock records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Move History */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Move History</h2>
            <Link href="/history" className="text-xs font-semibold text-blue-600 hover:underline">
              View full ledger &rarr;
            </Link>
          </div>
          <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Ref / Reason</th>
                  <th className="p-4">Product</th>
                  <th className="p-4 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {latestMoves.map((m) => {
                  const isIn = m.change > 0;
                  const prod = productMap.get(m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 text-xs">{m.reason}</div>
                        <div className="font-mono text-[11px] text-gray-400 truncate max-w-[120px]">{m.refId}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 text-xs truncate max-w-[180px]">
                          {prod?.name || m.productId}
                        </div>
                        <div className="text-[11px] font-mono text-gray-500">{prod?.sku}</div>
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            isIn
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {isIn ? `+${m.change}` : m.change}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {latestMoves.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

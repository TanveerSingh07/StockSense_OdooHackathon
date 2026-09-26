import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [totalReceipts, totalDeliveries, latestMoves, stockLevels] = await Promise.all([
    prisma.receipt.count(),
    prisma.deliveryOrder.count(),
    prisma.stockLedger.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.stockLevel.findMany({ take: 5, orderBy: { quantity: 'desc' } })
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Current Statistics / KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 border rounded-xl bg-white shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-blue-600 mb-2">{totalReceipts}</span>
          <span className="text-gray-500 font-medium uppercase text-sm tracking-wider">Total Receipts</span>
        </div>
        <div className="p-6 border rounded-xl bg-white shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-green-600 mb-2">{totalDeliveries}</span>
          <span className="text-gray-500 font-medium uppercase text-sm tracking-wider">Total Deliveries</span>
        </div>
        <div className="p-6 border rounded-xl bg-white shadow-sm flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-purple-600 mb-2">{stockLevels.reduce((acc, s) => acc + s.quantity, 0)}</span>
          <span className="text-gray-500 font-medium uppercase text-sm tracking-wider">Total Items in Stock</span>
        </div>
      </div>

      {/* Operations Submenu */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4">Operations</h2>
        <div className="flex gap-4">
          <Link href="/receipts" className="px-6 py-3 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200 hover:bg-blue-100 transition">
            1. Receipts
          </Link>
          <Link href="/deliveries" className="px-6 py-3 bg-green-50 text-green-700 font-semibold rounded-lg border border-green-200 hover:bg-green-100 transition">
            2. Deliveries
          </Link>
          <Link href="/adjustments/new" className="px-6 py-3 bg-purple-50 text-purple-700 font-semibold rounded-lg border border-purple-200 hover:bg-purple-100 transition">
            3. Adjustments
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Stock */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold">Available Stock</h2>
          </div>
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-sm">
                  <th className="p-4">Product ID</th>
                  <th className="p-4">Warehouse ID</th>
                  <th className="p-4 text-right">On Hand</th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50/50">
                    <td className="p-4 font-medium">{s.productId}</td>
                    <td className="p-4 text-sm text-gray-500">{s.warehouseId}</td>
                    <td className="p-4 text-right font-bold">{s.quantity}</td>
                  </tr>
                ))}
                {stockLevels.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-500">No stock found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Move History */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold">Recent Move History</h2>
            <Link href="/history" className="text-blue-600 hover:underline text-sm font-medium">View All &rarr;</Link>
          </div>
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-sm">
                  <th className="p-4">Reference</th>
                  <th className="p-4">Product</th>
                  <th className="p-4 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {latestMoves.map(m => {
                  const isIn = m.change > 0;
                  return (
                    <tr key={m.id} className="border-b hover:bg-gray-50/50">
                      <td className="p-4 font-mono text-xs">{m.refId.slice(-6)}</td>
                      <td className="p-4 text-sm font-medium">{m.productId}</td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isIn ? '+' : ''}{m.change}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {latestMoves.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-500">No recent moves</td>
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

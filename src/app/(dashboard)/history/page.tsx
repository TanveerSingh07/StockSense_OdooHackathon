import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function MoveHistoryPage() {
  const ledger = await prisma.stockLedger.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Move History</h1>
      
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4">Date</th>
              <th className="p-4">Reference ID</th>
              <th className="p-4">Product ID</th>
              <th className="p-4">Warehouse ID</th>
              <th className="p-4">Operation Type</th>
              <th className="p-4">Quantity Change</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((entry) => {
              const isIn = entry.change > 0;
              return (
                <tr key={entry.id} className="border-b hover:bg-gray-50/50">
                  <td className="p-4 text-sm text-gray-600">
                    {entry.createdAt.toLocaleString()}
                  </td>
                  <td className="p-4 font-mono text-sm">{entry.refId}</td>
                  <td className="p-4">{entry.productId}</td>
                  <td className="p-4 text-sm text-gray-500">{entry.warehouseId}</td>
                  <td className="p-4">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded border">
                      {entry.reason}
                    </span>
                  </td>
                  <td className="p-4">
                    {/* Excalidraw Workflow: In events should be display in green, Out moves should be display in red */}
                    <span className={`px-2 py-1 rounded text-xs font-bold ${isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isIn ? '+' : ''}{entry.change}
                    </span>
                  </td>
                </tr>
              );
            })}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">No stock movements found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

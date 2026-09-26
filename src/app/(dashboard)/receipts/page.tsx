import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ValidateButton from './ValidateButton';

export default async function ReceiptsPage() {
  const receipts = await prisma.receipt.findMany({
    include: { supplier: true, lines: true },
    orderBy: { id: 'desc' }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inbound Receipts</h1>
        <Link href="/receipts/new">
          <Button>+ New Receipt</Button>
        </Link>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4">ID</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Warehouse</th>
              <th className="p-4">Lines</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-4 font-mono text-sm">{r.id.slice(-6)}</td>
                <td className="p-4">{r.supplier?.name || r.supplierId}</td>
                <td className="p-4">{r.warehouseId}</td>
                <td className="p-4">{r.lines.length} items</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'DONE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4">
                  <ValidateButton receiptId={r.id} status={r.status} />
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">No receipts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

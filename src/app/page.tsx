import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatReference } from '@/lib/reference';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Package, 
  Boxes, 
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 text-[#F0F6FC]">
      {/* Dashboard Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">StockSense Operations Center</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Real-time warehouse logistics, inbound receipts, and stock move ledger.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="h-9 px-3.5 text-xs font-semibold bg-[#161B22] hover:bg-[#1F242C] border border-white/[0.08] text-slate-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Package className="h-3.5 w-3.5 text-emerald-400" />
            <span>Catalog ({products.length})</span>
          </Link>
          <Link
            href="/receipts/new"
            className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>New Receipt</span>
          </Link>
        </div>
      </div>

      {/* Operations Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Receipts Card */}
        <div className="bg-[#161B22] p-5 sm:p-6 rounded-xl border border-white/[0.08] shadow-sm hover:border-white/[0.14] transition flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-semibold tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 flex items-center gap-1">
                <ArrowDownLeft className="h-3 w-3" />
                Inbound Shipments
              </span>
              <span className="text-xs text-slate-400 font-mono">{totalReceiptOperations} ops</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Receipts</h2>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.06]">
                <span className="text-slate-400">To Receive / Ready</span>
                <span className="font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded font-mono">
                  {toReceiveCount}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.06]">
                <span className="text-slate-400">Total Inbound Runs</span>
                <span className="font-bold text-white font-mono">{totalReceiptOperations}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/[0.06]">
            <Link
              href="/receipts"
              className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2 bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/30 text-sky-300 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <span>Open Receipts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Deliveries Card */}
        <div className="bg-[#161B22] p-5 sm:p-6 rounded-xl border border-white/[0.08] shadow-sm hover:border-white/[0.14] transition flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Outbound Logistics
              </span>
              <span className="text-xs text-slate-400 font-mono">{totalDeliveryOperations} ops</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Deliveries</h2>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.06]">
                <span className="text-slate-400">Ready to Dispatch</span>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  {toDeliverCount}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.06]">
                <span className="text-slate-400">Waiting for Stock</span>
                <span className={`font-bold px-2 py-0.5 rounded font-mono ${
                  waitingCount > 0 
                    ? 'text-red-400 bg-red-500/10 border border-red-500/20' 
                    : 'text-slate-400 bg-white/[0.04]'
                }`}>
                  {waitingCount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/[0.06]">
            <Link
              href="/deliveries"
              className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition cursor-pointer"
            >
              <span>Open Deliveries</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Inventory Summary Card */}
        <div className="bg-[#161B22] p-5 sm:p-6 rounded-xl border border-white/[0.08] shadow-sm hover:border-white/[0.14] transition flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-semibold tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20 flex items-center gap-1">
                <Boxes className="h-3 w-3" />
                Stock Catalog
              </span>
              <span className="text-xs text-slate-400 font-mono">{products.length} SKUs</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Inventory Stock</h2>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.06]">
                <span className="text-slate-400">Total Units On Hand</span>
                <span className="font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded font-mono">
                  {totalItemsInStock}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/[0.06]">
                <span className="text-slate-400">Warehouses Active</span>
                <span className="font-bold text-white font-mono">{warehouses.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/[0.06]">
            <Link
              href="/products"
              className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2 bg-teal-600/15 hover:bg-teal-600/25 border border-teal-500/30 text-teal-300 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <span>View Stock Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Operations Submenu Action Strip */}
      <div className="bg-[#161B22] p-5 rounded-xl border border-white/[0.08] shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Quick Operation Triggers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/receipts/new"
            className="flex items-center gap-3 p-3.5 bg-sky-500/[0.05] hover:bg-sky-500/[0.1] border border-sky-500/20 rounded-xl transition group"
          >
            <span className="h-9 w-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <ArrowDownLeft className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="font-semibold text-sky-200 group-hover:text-white text-xs">1. Create Receipt</div>
              <div className="text-[11px] text-slate-400">Incoming vendor shipment</div>
            </div>
          </Link>

          <Link
            href="/deliveries/new"
            className="flex items-center gap-3 p-3.5 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.1] border border-emerald-500/20 rounded-xl transition group"
          >
            <span className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <ArrowUpRight className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="font-semibold text-emerald-200 group-hover:text-white text-xs">2. Create Delivery</div>
              <div className="text-[11px] text-slate-400">Outbound customer dispatch</div>
            </div>
          </Link>

          <Link
            href="/adjustments/new"
            className="flex items-center gap-3 p-3.5 bg-purple-500/[0.05] hover:bg-purple-500/[0.1] border border-purple-500/20 rounded-xl transition group"
          >
            <span className="h-9 w-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="font-semibold text-purple-200 group-hover:text-white text-xs">3. Stock Adjustment</div>
              <div className="text-[11px] text-slate-400">Physical count audit diffs</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Available Stock & Move History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Stock Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-white">Available Stock Highlights</h2>
            <Link href="/products" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
              View all products →
            </Link>
          </div>
          <div className="border border-white/[0.08] rounded-xl bg-[#161B22] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Warehouse</th>
                  <th className="p-3.5 text-right">On Hand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {stockLevels.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5">
                      <div className="font-medium text-slate-100">{s.product?.name || s.productId}</div>
                      <div className="text-[11px] font-mono text-slate-400">{s.product?.sku}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 text-[11px]">{s.warehouse?.name || s.warehouseId}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">{s.quantity}</td>
                  </tr>
                ))}
                {stockLevels.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">
                      No stock records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Move History Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-white">Recent Move Ledger</h2>
            <Link href="/history" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
              View full ledger →
            </Link>
          </div>
          <div className="border border-white/[0.08] rounded-xl bg-[#161B22] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Ref / Reason</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {latestMoves.map((m) => {
                  const isIn = m.change > 0;
                  const prod = productMap.get(m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <div className="font-medium text-white text-xs">{m.reason}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{m.refId}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-200 text-xs truncate max-w-[160px]">
                          {prod?.name || m.productId}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{prod?.sku}</div>
                      </td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            isIn
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
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
                    <td colSpan={3} className="p-6 text-center text-slate-400">
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

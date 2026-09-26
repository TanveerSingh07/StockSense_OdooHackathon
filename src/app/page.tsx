import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Package, 
  Boxes, 
  ArrowRight,
  TrendingUp,
  Activity,
  AlertTriangle,
  FileText,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { DashboardFilterBar } from '@/components/dashboard/dashboard-filter-bar';

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams?: Promise<{
    warehouseId?: string;
    categoryId?: string;
    docType?: string;
    status?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const warehouseId = resolvedParams.warehouseId || 'all';
  const categoryId = resolvedParams.categoryId || 'all';
  const docType = resolvedParams.docType || 'all';
  const status = resolvedParams.status || 'all';

  const [categories, warehouses, receipts, deliveries, latestMoves, stockLevels, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.warehouse.findMany({ orderBy: { name: 'asc' } }),
    prisma.receipt.findMany({
      where: {
        ...(warehouseId !== 'all' ? { warehouseId } : {}),
        ...(status !== 'all' ? { status: status as 'DRAFT' | 'DONE' } : {}),
      },
      include: { lines: true, supplier: true },
      orderBy: { id: 'asc' },
    }),
    prisma.deliveryOrder.findMany({
      where: {
        ...(warehouseId !== 'all' ? { warehouseId } : {}),
        ...(status !== 'all' ? { status: status as 'DRAFT' | 'DONE' } : {}),
      },
      include: { lines: true },
      orderBy: { id: 'asc' },
    }),
    prisma.stockLedger.findMany({
      where: {
        ...(warehouseId !== 'all' ? { warehouseId } : {}),
        ...(docType !== 'all'
          ? docType === 'RECEIPT'
            ? { reason: 'RECEIPT' }
            : docType === 'DELIVERY'
            ? { reason: 'DELIVERY' }
            : {}
          : {}),
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stockLevel.findMany({
      where: {
        ...(warehouseId !== 'all' ? { warehouseId } : {}),
        ...(categoryId !== 'all' ? { product: { categoryId } } : {}),
      },
      include: { product: { include: { category: true } }, warehouse: true },
      orderBy: { quantity: 'desc' },
      take: 8,
    }),
    prisma.product.findMany({
      where: categoryId !== 'all' ? { categoryId } : undefined,
      include: {
        category: true,
        levels: warehouseId !== 'all' ? { where: { warehouseId } } : true,
      },
      orderBy: { name: 'asc' },
    }),
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
  const totalPendingDocs = toReceiveCount + toDeliverCount + waitingCount;
  const totalItemsInStock = stockLevels.reduce((acc, s) => acc + s.quantity, 0);

  // Low stock calculation
  const formattedProducts = products.map((p) => {
    const totalQty = (p.levels || []).reduce((sum, lvl) => sum + lvl.quantity, 0);
    const isLow = totalQty <= p.reorderPoint;
    return { ...p, totalQuantity: totalQty, isLowStock: isLow };
  });

  const lowStockProducts = formattedProducts.filter((p) => p.isLowStock);
  const healthyCount = formattedProducts.filter((p) => !p.isLowStock && p.totalQuantity > 0).length;
  const healthPercentage = formattedProducts.length > 0
    ? Math.round((healthyCount / formattedProducts.length) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-[#dae2fd]">
      {/* Dashboard Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#dae2fd] tracking-tight">StockSense Operations Center</h1>
          <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">Real-time warehouse logistics, inbound receipts, and stock move ledger.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="h-9 px-3.5 text-xs font-semibold bg-[#131b2e] hover:bg-[#171f33] border border-[#2d3449]/70 text-[#dae2fd] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Package className="h-3.5 w-3.5 text-[#ffc174]" />
            <span>Catalog ({products.length})</span>
          </Link>
          <Link
            href="/receipts/new"
            className="h-9 px-4 text-xs font-semibold bg-[#ffc174] hover:bg-[#f59e0b] text-[#090D16] rounded-lg shadow-sm shadow-[#ffc174]/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="h-4 w-4" />
            <span>New Receipt</span>
          </Link>
        </div>
      </div>

      {/* Dashboard Filters Bar */}
      <DashboardFilterBar
        warehouses={warehouses}
        categories={categories}
        activeWarehouseId={warehouseId}
        activeCategoryId={categoryId}
        activeDocType={docType}
        activeStatus={status}
      />

      {/* 4 High-Impact KPI Cards (Products, Low Stock, Pending Docs, Total Inventory) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total SKUs / Products */}
        <div className="p-4.5 rounded-xl bg-[#131b2e] border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#94a3b8] mb-2">
            <span className="text-xs font-medium">Total Products</span>
            <div className="h-7 w-7 rounded-lg bg-[#ffc174]/10 border border-[#ffc174]/20 flex items-center justify-center text-[#ffc174]">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#dae2fd] tracking-tight">
              {products.length}
            </div>
            <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center gap-1">
              <span className="text-[#ffc174] font-medium">
                {categoryId !== 'all' ? 'Filtered category' : 'Active'}
              </span>
              <span>across {warehouseId !== 'all' ? 'selected' : warehouses.length} warehouse(s)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#2d3449]/50">
            <Link href="/products" className="text-[11px] font-semibold text-[#ffc174] hover:underline flex items-center gap-1">
              <span>View catalog</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* KPI 2: Low Stock Alerts */}
        <div className={`p-4.5 rounded-xl border shadow-sm transition-all flex flex-col justify-between ${
          lowStockProducts.length > 0 
            ? 'bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/30' 
            : 'bg-[#131b2e] border-[#2d3449]/70'
        }`}>
          <div className="flex items-center justify-between text-[#94a3b8] mb-2">
            <span className="text-xs font-medium">Low Stock Alerts</span>
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
              lowStockProducts.length > 0 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-[#ffc174]/10 border border-[#ffc174]/20 text-[#ffc174]'
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#dae2fd] tracking-tight">
              {lowStockProducts.length} <span className="text-xs font-normal text-[#94a3b8]">Items</span>
            </div>
            <div className="text-[11px] text-[#94a3b8] mt-1">
              {lowStockProducts.length > 0 ? (
                <span className="text-amber-400">Needs replenishment</span>
              ) : (
                <span className="text-[#ffc174]">All levels optimal</span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#2d3449]/50">
            <Link href="/products" className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1">
              <span>Filter low stock</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* KPI 3: Pending Inbound & Outbound Docs */}
        <div className="p-4.5 rounded-xl bg-[#131b2e] border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#94a3b8] mb-2">
            <span className="text-xs font-medium">Pending Documents</span>
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#dae2fd] tracking-tight">
              {totalPendingDocs} <span className="text-xs font-normal text-[#94a3b8]">Orders</span>
            </div>
            <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center gap-2">
              <span className="text-sky-400">{toReceiveCount} in</span>
              <span>•</span>
              <span className="text-[#ffc174]">{toDeliverCount} ready out</span>
              {waitingCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-red-400">{waitingCount} wait</span>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#2d3449]/50 flex items-center justify-between text-[11px]">
            <Link href="/receipts" className="text-sky-400 hover:underline font-medium">
              Receipts ({totalReceiptOperations})
            </Link>
            <Link href="/deliveries" className="text-[#ffc174] hover:underline font-medium">
              Deliveries ({totalDeliveryOperations})
            </Link>
          </div>
        </div>

        {/* KPI 4: Total Inventory & Stock Health */}
        <div className="p-4.5 rounded-xl bg-[#131b2e] border border-[#2d3449]/70 shadow-sm hover:border-[#2d3449] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#94a3b8] mb-2">
            <span className="text-xs font-medium">Total On-Hand</span>
            <div className="h-7 w-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#dae2fd] tracking-tight">
                {totalItemsInStock}
              </span>
              <span className="text-xs font-semibold text-[#ffc174]">
                ({healthPercentage}% healthy)
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#2d3449]/40 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full transition-all duration-500 ${
                  healthPercentage >= 75 ? 'bg-[#ffc174]' : healthPercentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#2d3449]/50">
            <span className="text-[11px] text-[#94a3b8]">
              {healthyCount} of {formattedProducts.length} items stocked
            </span>
          </div>
        </div>
      </div>

      {/* Operations Quick Action Submenu */}
      <div className="bg-[#131b2e] p-5 rounded-xl border border-[#2d3449]/70 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-3">Quick Operation Triggers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/receipts/new"
            className="flex items-center gap-3 p-3.5 bg-sky-500/[0.05] hover:bg-sky-500/[0.1] border border-sky-500/20 rounded-xl transition group"
          >
            <span className="h-9 w-9 rounded-lg bg-sky-600 text-[#dae2fd] flex items-center justify-center font-bold text-sm shadow-sm">
              <ArrowDownLeft className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="font-semibold text-sky-200 group-hover:text-[#dae2fd] text-xs">1. Create Receipt</div>
              <div className="text-[11px] text-[#94a3b8]">Incoming vendor shipment</div>
            </div>
          </Link>

          <Link
            href="/deliveries/new"
            className="flex items-center gap-3 p-3.5 bg-[#ffc174]/[0.05] hover:bg-[#ffc174]/[0.1] border border-[#ffc174]/20 rounded-xl transition group"
          >
            <span className="h-9 w-9 rounded-lg bg-[#ffc174] text-[#090D16] flex items-center justify-center font-bold text-sm shadow-sm">
              <ArrowUpRight className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="font-semibold text-[#ffd49d] group-hover:text-[#dae2fd] text-xs">2. Create Delivery</div>
              <div className="text-[11px] text-[#94a3b8]">Outbound customer dispatch</div>
            </div>
          </Link>

          <Link
            href="/adjustments/new"
            className="flex items-center gap-3 p-3.5 bg-purple-500/[0.05] hover:bg-purple-500/[0.1] border border-purple-500/20 rounded-xl transition group"
          >
            <span className="h-9 w-9 rounded-lg bg-purple-600 text-[#dae2fd] flex items-center justify-center font-bold text-sm shadow-sm">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="font-semibold text-purple-200 group-hover:text-[#dae2fd] text-xs">3. Stock Adjustment</div>
              <div className="text-[11px] text-[#94a3b8]">Physical count audit diffs</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Available Stock & Move History Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Stock Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-[#dae2fd]">Available Stock Highlights</h2>
            <Link href="/products" className="text-xs font-semibold text-[#ffc174] hover:text-[#ffd49d] hover:underline">
              View all products →
            </Link>
          </div>
          <div className="border border-[#2d3449]/70 rounded-xl bg-[#131b2e] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2d3449]/70 bg-[#171f33]/40 text-[#94a3b8] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Warehouse</th>
                  <th className="p-3.5 text-right">On Hand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3449]/50">
                {stockLevels.map((s) => (
                  <tr key={s.id} className="hover:bg-[#171f33]/60 transition-colors">
                    <td className="p-3.5">
                      <div className="font-medium text-[#dae2fd]">{s.product?.name || s.productId}</div>
                      <div className="text-[11px] font-mono text-[#94a3b8]">
                        {s.product?.sku} {s.product?.category ? `• ${s.product.category.name}` : ''}
                      </div>
                    </td>
                    <td className="p-3.5 text-[#b0bec5] text-[11px]">{s.warehouse?.name || s.warehouseId}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-[#ffc174]">{s.quantity}</td>
                  </tr>
                ))}
                {stockLevels.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-[#94a3b8]">
                      No stock records matching current filters.
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
            <h2 className="text-sm font-semibold text-[#dae2fd]">Recent Move Ledger</h2>
            <Link href="/history" className="text-xs font-semibold text-[#ffc174] hover:text-[#ffd49d] hover:underline">
              View full ledger →
            </Link>
          </div>
          <div className="border border-[#2d3449]/70 rounded-xl bg-[#131b2e] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2d3449]/70 bg-[#171f33]/40 text-[#94a3b8] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Ref / Reason</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3449]/50">
                {latestMoves.map((m) => {
                  const isIn = m.change > 0;
                  const prod = productMap.get(m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-[#171f33]/60 transition-colors">
                      <td className="p-3.5">
                        <div className="font-medium text-[#dae2fd] text-xs">{m.reason}</div>
                        <div className="font-mono text-[10px] text-[#94a3b8] truncate max-w-[120px]">{m.refId}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-[#dae2fd] text-xs truncate max-w-[160px]">
                          {prod?.name || m.productId}
                        </div>
                        <div className="text-[10px] font-mono text-[#94a3b8]">{prod?.sku}</div>
                      </td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            isIn
                              ? 'bg-[#ffc174]/15 text-[#ffc174] border border-[#ffc174]/30'
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
                    <td colSpan={3} className="p-6 text-center text-[#94a3b8]">
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

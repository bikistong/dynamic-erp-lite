const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db/prisma');
const { authenticate } = require('../../shared/middleware/auth');

router.get('/summary', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalItems,
      totalActiveItems,
      totalCustomers,
      totalSuppliers,
      totalInvoicesPosted,
      totalInvoicesPaid,
      totalInvoicesDraft,
      revenueThisMonth,
      revenueLastMonth,
      pendingPOs,
      lowStockItems,
      recentInvoices,
      recentPOs,
    ] = await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { active: true } }),
      prisma.customer.count({ where: { active: true } }),
      prisma.supplier.count({ where: { active: true } }),
      prisma.salesInvoice.count({ where: { status: 'posted' } }),
      prisma.salesInvoice.count({ where: { status: 'paid' } }),
      prisma.salesInvoice.count({ where: { status: 'draft' } }),
      prisma.salesInvoice.aggregate({
        where: { status: { in: ['posted', 'paid'] }, date: { gte: firstDayThisMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.salesInvoice.aggregate({
        where: { status: { in: ['posted', 'paid'] }, date: { gte: firstDayLastMonth, lte: lastDayLastMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.count({ where: { status: { in: ['draft', 'submitted'] } } }),
      prisma.item.findMany({
        where: { active: true, stock: { lt: 10 } },
        select: { id: true, sku: true, name: true, stock: true, uom: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
      prisma.salesInvoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: { select: { name: true } } },
        select: {
          id: true, invoiceNo: true, status: true, totalAmount: true, date: true,
          customer: { select: { name: true } },
        },
      }),
      prisma.purchaseOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { supplier: { select: { name: true } } },
        select: {
          id: true, poNumber: true, status: true, totalAmount: true, date: true,
          supplier: { select: { name: true } },
        },
      }),
    ]);

    const revenueNow = revenueThisMonth._sum.totalAmount || 0;
    const revenuePrev = revenueLastMonth._sum.totalAmount || 0;
    const revenueGrowth = revenuePrev > 0 ? ((revenueNow - revenuePrev) / revenuePrev) * 100 : null;

    // Inventory stock value
    const stockValue = await prisma.item.aggregate({
      where: { active: true },
      _sum: { stock: true },
    });

    res.json({
      status: 'ok',
      data: {
        inventory: {
          totalItems,
          totalActiveItems,
          lowStockCount: lowStockItems.length,
          lowStockItems,
        },
        customers: { total: totalCustomers },
        suppliers: { total: totalSuppliers },
        sales: {
          draftInvoices: totalInvoicesDraft,
          postedInvoices: totalInvoicesPosted,
          paidInvoices: totalInvoicesPaid,
          revenueThisMonth: revenueNow,
          revenueLastMonth: revenuePrev,
          revenueGrowthPercent: revenueGrowth !== null ? Math.round(revenueGrowth * 10) / 10 : null,
        },
        purchasing: { pendingOrders: pendingPOs },
        recentActivity: {
          invoices: recentInvoices,
          purchaseOrders: recentPOs,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;

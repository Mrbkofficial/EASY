import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';

export function GET() {
  return withUser(async (userId) => {
    const now = new Date();

    const [
      customerCount,
      activeJobs,
      openInvoices,
      pendingQuotes,
      recentJobs,
      seaiOpen,
    ] = await Promise.all([
      prisma.customer.count({ where: { userId } }),
      prisma.job.count({
        where: { userId, status: { in: ['LEAD', 'QUOTED', 'SCHEDULED', 'IN_PROGRESS'] } },
      }),
      prisma.invoice.findMany({
        where: { userId, status: { in: ['SENT', 'OVERDUE', 'DRAFT'] } },
        select: { total: true, amountPaid: true, dueDate: true, status: true },
      }),
      prisma.quote.count({ where: { userId, status: { in: ['DRAFT', 'SENT'] } } }),
      prisma.job.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        include: { customer: { select: { name: true } } },
      }),
      prisma.seaiProject.count({ where: { userId, approved: false } }),
    ]);

    // Amount owed to the business across unpaid invoices.
    const outstanding = openInvoices.reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
    const overdue = openInvoices
      .filter((i) => i.dueDate && i.dueDate < now && i.status !== 'PAID')
      .reduce((sum, i) => sum + (i.total - i.amountPaid), 0);

    // Paid this month (revenue).
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidThisMonth = await prisma.invoice.aggregate({
      where: { userId, status: 'PAID', paidDate: { gte: monthStart } },
      _sum: { total: true },
    });

    return NextResponse.json({
      stats: {
        customerCount,
        activeJobs,
        pendingQuotes,
        outstanding: Math.round(outstanding * 100) / 100,
        overdue: Math.round(overdue * 100) / 100,
        paidThisMonth: paidThisMonth._sum.total ?? 0,
        seaiOpen,
        recentJobs,
      },
    });
  });
}

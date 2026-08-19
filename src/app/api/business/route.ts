import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  businessName: z.string().max(160).nullable().optional(),
  businessEmail: z.string().email().nullable().optional().or(z.literal('')),
  phone: z.string().max(40).nullable().optional(),
  address: z.string().max(400).nullable().optional(),
  eircode: z.string().max(20).nullable().optional(),
  vatNumber: z.string().max(40).nullable().optional(),
  taxNumber: z.string().max(40).nullable().optional(),
  logoUrl: z.string().url().nullable().optional().or(z.literal('')),
  bankDetails: z.string().max(1000).nullable().optional(),
  defaultVatRate: z.number().min(0).max(100).optional(),
  quotePrefix: z.string().max(10).optional(),
  invoicePrefix: z.string().max(10).optional(),
  quoteTerms: z.string().max(2000).nullable().optional(),
  invoiceTerms: z.string().max(2000).nullable().optional(),
});

export function GET() {
  return withUser(async (userId) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true, email: true, businessName: true, businessEmail: true, phone: true,
        address: true, eircode: true, vatNumber: true, taxNumber: true, logoUrl: true,
        bankDetails: true, defaultVatRate: true, quotePrefix: true, invoicePrefix: true,
        quoteTerms: true, invoiceTerms: true, nextQuoteSeq: true, nextInvoiceSeq: true,
      },
    });
    return NextResponse.json({ business: user });
  });
}

export function PATCH(req: NextRequest) {
  return withUser(async (userId) => {
    const body = schema.parse(await req.json());
    const data = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, v === '' ? null : v])
    );
    const user = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json({ ok: true, businessName: user.businessName });
  });
}

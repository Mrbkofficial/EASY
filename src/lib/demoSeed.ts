import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { randomToken } from '@/lib/utils';
import { computeTotals } from '@/lib/money';

export const DEMO_EMAIL = 'demo@obrienplumbing.ie';
export const DEMO_PASSWORD = 'demo1234';

// Seeds a realistic demo account for a fresh deployment. No-ops if the demo
// account already exists, so it is safe to call more than once.
export async function seedDemo(): Promise<{ created: boolean; email: string; password: string }> {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) return { created: false, email: DEMO_EMAIL, password: DEMO_PASSWORD };

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      name: "Sean O'Brien",
      email: DEMO_EMAIL,
      passwordHash,
      businessName: "O'Brien Plumbing & Heating",
      businessEmail: 'info@obrienplumbing.ie',
      phone: '087 234 5678',
      address: 'Unit 4, Oranmore Business Park, Galway',
      eircode: 'H91 XY23',
      vatNumber: 'IE9876543A',
      bankDetails: 'Bank: AIB\nIBAN: IE29 AIBK 9311 5212 3456 78\nBIC: AIBKIE2D',
      defaultVatRate: 13.5,
      nextQuoteSeq: 3,
      nextInvoiceSeq: 3,
      quoteTerms: 'Quote valid for 30 days. 50% deposit required to book work.',
      invoiceTerms: 'Payment due within 30 days of invoice date.',
      notificationPreference: { create: {} },
    },
  });

  const mary = await prisma.customer.create({
    data: { userId: user.id, name: 'Mary Kelly', phone: '086 111 2233', email: 'mary.kelly@email.ie',
      address: '12 Seaview Terrace, Salthill, Galway', eircode: 'H91 A1B2', notes: 'Key under the plant pot. Friendly dog.' },
  });
  const john = await prisma.customer.create({
    data: { userId: user.id, name: 'John Murphy', phone: '085 998 7766', email: 'jmurphy@email.ie',
      address: '4 The Grove, Oranmore, Galway', eircode: 'H91 C3D4' },
  });
  const aoife = await prisma.customer.create({
    data: { userId: user.id, name: 'Aoife Ryan', phone: '083 445 6677',
      address: '27 Riverside, Claregalway', eircode: 'H91 E5F6', notes: 'Prefers WhatsApp over calls.' },
  });

  const job1 = await prisma.job.create({
    data: { userId: user.id, customerId: mary.id, title: 'Attic insulation upgrade', trade: 'INSULATION',
      status: 'IN_PROGRESS', description: 'Top-up attic insulation to 300mm across full attic (approx 65m²). Includes attic hatch draught-proofing.',
      scheduledFor: new Date(Date.now() + 3 * 864e5) },
  });
  await prisma.seaiProject.create({
    data: { userId: user.id, jobId: job1.id, grantType: 'ATTIC_INSULATION', applicationRef: 'HEA-204815',
      berBefore: 'D1', grantAmount: 1500, submitted: true,
      checklist: [
        { key: '0', label: 'Pre-works BER certificate on file', done: true },
        { key: '1', label: 'Photos of attic before works', done: true },
        { key: '2', label: 'Depth of insulation recorded (min 300mm)', done: true },
        { key: '3', label: 'Declaration of Works signed by homeowner', done: true },
        { key: '4', label: 'Product / material certs (thermal conductivity)', done: false },
        { key: '5', label: 'Photos of completed insulation with depth gauge', done: false },
        { key: '6', label: 'Post-works BER assessment arranged', done: false },
      ] },
  });

  const job2 = await prisma.job.create({
    data: { userId: user.id, customerId: john.id, title: 'Boiler replacement — condensing combi', trade: 'HEATING',
      status: 'QUOTED', description: 'Remove old non-condensing boiler, supply & fit new A-rated combi, power flush system, new controls.' },
  });
  const job3 = await prisma.job.create({
    data: { userId: user.id, customerId: aoife.id, title: 'En-suite bathroom re-plumb', trade: 'PLUMBING',
      status: 'INVOICED', description: 'Full re-plumb of en-suite: new shower, WC and basin. Re-route waste.' },
  });
  await prisma.job.create({
    data: { userId: user.id, customerId: mary.id, title: 'Outside tap install', trade: 'PLUMBING', status: 'LEAD' },
  });

  const q2Items = [
    { description: 'A-rated condensing combi boiler (supply)', quantity: 1, unitPrice: 1250, vatRate: 23, position: 0 },
    { description: 'Installation labour (2 days)', quantity: 2, unitPrice: 320, vatRate: 13.5, position: 1 },
    { description: 'System power flush', quantity: 1, unitPrice: 350, vatRate: 13.5, position: 2 },
    { description: 'Smart heating controls', quantity: 1, unitPrice: 220, vatRate: 23, position: 3 },
  ];
  const q2t = computeTotals(q2Items);
  await prisma.quote.create({
    data: { userId: user.id, customerId: john.id, jobId: job2.id, number: 'Q-0002', status: 'SENT',
      shareToken: randomToken(), validUntil: new Date(Date.now() + 30 * 864e5),
      notes: 'Includes disposal of old boiler and 2-year workmanship guarantee.',
      terms: 'Quote valid for 30 days. 50% deposit required to book work.',
      subtotal: q2t.subtotal, vatTotal: q2t.vatTotal, total: q2t.total, items: { create: q2Items } },
  });
  const q1Items = [
    { description: 'Attic insulation — mineral wool 300mm', quantity: 65, unitPrice: 18, vatRate: 13.5, position: 0 },
    { description: 'Attic hatch draught-proofing kit', quantity: 1, unitPrice: 85, vatRate: 23, position: 1 },
  ];
  const q1t = computeTotals(q1Items);
  await prisma.quote.create({
    data: { userId: user.id, customerId: mary.id, jobId: job1.id, number: 'Q-0001', status: 'ACCEPTED',
      shareToken: randomToken(), subtotal: q1t.subtotal, vatTotal: q1t.vatTotal, total: q1t.total, items: { create: q1Items } },
  });

  const i1Items = [
    { description: 'Bathroom re-plumb labour (3 days)', quantity: 3, unitPrice: 320, vatRate: 13.5, position: 0 },
    { description: 'Shower valve, WC & basin (supply)', quantity: 1, unitPrice: 640, vatRate: 23, position: 1 },
    { description: 'Sundries & fittings', quantity: 1, unitPrice: 120, vatRate: 23, position: 2 },
  ];
  const i1t = computeTotals(i1Items);
  await prisma.invoice.create({
    data: { userId: user.id, customerId: aoife.id, jobId: job3.id, number: 'INV-0001', status: 'SENT',
      shareToken: randomToken(), dueDate: new Date(Date.now() + 21 * 864e5),
      notes: 'Thanks for your business!', terms: 'Payment due within 30 days of invoice date.',
      subtotal: i1t.subtotal, vatTotal: i1t.vatTotal, total: i1t.total, items: { create: i1Items } },
  });
  const i2Items = [{ description: 'Emergency leak repair — callout & labour', quantity: 1, unitPrice: 180, vatRate: 13.5, position: 0 }];
  const i2t = computeTotals(i2Items);
  await prisma.invoice.create({
    data: { userId: user.id, customerId: mary.id, number: 'INV-0002', status: 'PAID',
      shareToken: randomToken(), paidDate: new Date(), amountPaid: i2t.total,
      subtotal: i2t.subtotal, vatTotal: i2t.vatTotal, total: i2t.total, items: { create: i2Items } },
  });

  return { created: true, email: DEMO_EMAIL, password: DEMO_PASSWORD };
}

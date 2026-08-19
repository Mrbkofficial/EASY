// Seeds a demo TradeMate account with realistic Irish trades data (preview only).
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

function token(n = 20) {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
}
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
function totals(items) {
  let sub = 0, vat = 0;
  for (const it of items) { const net = it.quantity * it.unitPrice; sub += net; vat += net * (it.vatRate / 100); }
  return { subtotal: round2(sub), vatTotal: round2(vat), total: round2(sub + vat) };
}

async function main() {
  await prisma.user.deleteMany({ where: { email: 'demo@obrienplumbing.ie' } });
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.create({
    data: {
      name: "Sean O'Brien",
      email: 'demo@obrienplumbing.ie',
      passwordHash,
      businessName: "O'Brien Plumbing & Heating",
      businessEmail: 'info@obrienplumbing.ie',
      phone: '087 234 5678',
      address: 'Unit 4, Oranmore Business Park, Galway',
      eircode: 'H91 XY23',
      vatNumber: 'IE9876543A',
      bankDetails: 'Bank: AIB\nIBAN: IE29 AIBK 9311 5212 3456 78\nBIC: AIBKIE2D',
      defaultVatRate: 13.5,
      quotePrefix: 'Q',
      invoicePrefix: 'INV',
      nextQuoteSeq: 4,
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

  // Job 1 — insulation with SEAI (in progress)
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

  // Job 2 — boiler (quoted)
  const job2 = await prisma.job.create({
    data: { userId: user.id, customerId: john.id, title: 'Boiler replacement — condensing combi', trade: 'HEATING',
      status: 'QUOTED', description: 'Remove old non-condensing boiler, supply & fit new A-rated combi, power flush system, new controls.' },
  });

  // Job 3 — bathroom (completed, invoiced)
  const job3 = await prisma.job.create({
    data: { userId: user.id, customerId: aoife.id, title: 'En-suite bathroom re-plumb', trade: 'PLUMBING',
      status: 'INVOICED', description: 'Full re-plumb of en-suite: new shower, WC and basin. Re-route waste.' },
  });

  // Job 4 — lead
  await prisma.job.create({
    data: { userId: user.id, customerId: mary.id, title: 'Outside tap install', trade: 'PLUMBING', status: 'LEAD' },
  });

  // Quote for job2
  const q2Items = [
    { description: 'A-rated condensing combi boiler (supply)', quantity: 1, unitPrice: 1250, vatRate: 23, position: 0 },
    { description: 'Installation labour (2 days)', quantity: 2, unitPrice: 320, vatRate: 13.5, position: 1 },
    { description: 'System power flush', quantity: 1, unitPrice: 350, vatRate: 13.5, position: 2 },
    { description: 'Smart heating controls', quantity: 1, unitPrice: 220, vatRate: 23, position: 3 },
  ];
  const q2t = totals(q2Items);
  await prisma.quote.create({
    data: { userId: user.id, customerId: john.id, jobId: job2.id, number: 'Q-0002', status: 'SENT',
      shareToken: token(), validUntil: new Date(Date.now() + 30 * 864e5), notes: 'Includes disposal of old boiler and 2-year workmanship guarantee.',
      terms: 'Quote valid for 30 days. 50% deposit required to book work.', ...q2t,
      items: { create: q2Items } },
  });
  // A draft quote
  const q1Items = [
    { description: 'Attic insulation — mineral wool 300mm', quantity: 65, unitPrice: 18, vatRate: 13.5, position: 0 },
    { description: 'Attic hatch draught-proofing kit', quantity: 1, unitPrice: 85, vatRate: 23, position: 1 },
  ];
  const q1t = totals(q1Items);
  await prisma.quote.create({
    data: { userId: user.id, customerId: mary.id, jobId: job1.id, number: 'Q-0001', status: 'ACCEPTED',
      shareToken: token(), ...q1t, items: { create: q1Items } },
  });

  // Invoice for job3 (sent, due soon)
  const i1Items = [
    { description: 'Bathroom re-plumb labour (3 days)', quantity: 3, unitPrice: 320, vatRate: 13.5, position: 0 },
    { description: 'Shower valve, WC & basin (supply)', quantity: 1, unitPrice: 640, vatRate: 23, position: 1 },
    { description: 'Sundries & fittings', quantity: 1, unitPrice: 120, vatRate: 23, position: 2 },
  ];
  const i1t = totals(i1Items);
  await prisma.invoice.create({
    data: { userId: user.id, customerId: aoife.id, jobId: job3.id, number: 'INV-0001', status: 'SENT',
      shareToken: token(), dueDate: new Date(Date.now() + 21 * 864e5),
      notes: 'Thanks for your business!', terms: 'Payment due within 30 days of invoice date.', ...i1t,
      items: { create: i1Items } },
  });
  // A paid invoice
  const i2Items = [{ description: 'Emergency leak repair — callout & labour', quantity: 1, unitPrice: 180, vatRate: 13.5, position: 0 }];
  const i2t = totals(i2Items);
  await prisma.invoice.create({
    data: { userId: user.id, customerId: mary.id, number: 'INV-0002', status: 'PAID',
      shareToken: token(), paidDate: new Date(), amountPaid: i2t.total, ...i2t, items: { create: i2Items } },
  });

  console.log('Seeded demo account: demo@obrienplumbing.ie / demo1234');
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

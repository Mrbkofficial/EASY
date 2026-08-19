import type {
  TradeKey,
  JobStatusKey,
  QuoteStatusKey,
  InvoiceStatusKey,
} from '@/lib/trades';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  eircode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { jobs: number; invoices: number };
}

export interface Job {
  id: string;
  customerId: string;
  title: string;
  trade: TradeKey;
  status: JobStatusKey;
  description: string | null;
  address: string | null;
  eircode: string | null;
  scheduledFor: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string; phone?: string | null };
}

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  position?: number;
}

export interface Quote {
  id: string;
  customerId: string;
  jobId: string | null;
  number: string;
  status: QuoteStatusKey;
  issueDate: string;
  validUntil: string | null;
  notes: string | null;
  terms: string | null;
  shareToken: string;
  subtotal: number;
  vatTotal: number;
  total: number;
  items?: LineItem[];
  customer?: { id: string; name: string; phone?: string | null };
  createdAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  jobId: string | null;
  quoteId: string | null;
  number: string;
  status: InvoiceStatusKey;
  issueDate: string;
  dueDate: string | null;
  paidDate: string | null;
  amountPaid: number;
  notes: string | null;
  terms: string | null;
  shareToken: string;
  subtotal: number;
  vatTotal: number;
  total: number;
  items?: LineItem[];
  customer?: { id: string; name: string; phone?: string | null };
  createdAt: string;
}

export interface SeaiDocument {
  id: string;
  label: string;
  kind: string;
  url: string;
  createdAt: string;
}

export interface SeaiProject {
  id: string;
  jobId: string;
  grantType: string;
  applicationRef: string | null;
  berBefore: string | null;
  berAfter: string | null;
  grantAmount: number | null;
  submitted: boolean;
  approved: boolean;
  checklist: { key: string; label: string; done: boolean }[];
  notes: string | null;
  documents?: SeaiDocument[];
  job?: Job & { customer?: Customer };
  _count?: { documents: number };
}

export interface Business {
  name: string | null;
  email: string | null;
  businessName: string | null;
  businessEmail: string | null;
  phone: string | null;
  address: string | null;
  eircode: string | null;
  vatNumber: string | null;
  taxNumber: string | null;
  logoUrl: string | null;
  bankDetails: string | null;
  defaultVatRate: number;
  quotePrefix: string;
  invoicePrefix: string;
  quoteTerms: string | null;
  invoiceTerms: string | null;
}

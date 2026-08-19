'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/client';
import type { Customer, Job, Quote, Invoice, SeaiProject, Business } from '@/types';

export function useCustomers(q?: string) {
  const { data, error, isLoading, mutate } = useSWR<{ customers: Customer[] }>(
    `/api/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    fetcher
  );
  return { customers: data?.customers ?? [], error, isLoading, mutate };
}

export function useCustomer(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ customer: Customer & { jobs: Job[]; invoices: Invoice[]; quotes: Quote[] } }>(
    id ? `/api/customers/${id}` : null,
    fetcher
  );
  return { customer: data?.customer, error, isLoading, mutate };
}

export function useJobs(params: { status?: string; customerId?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.customerId) qs.set('customerId', params.customerId);
  const { data, error, isLoading, mutate } = useSWR<{ jobs: Job[] }>(
    `/api/jobs?${qs.toString()}`,
    fetcher
  );
  return { jobs: data?.jobs ?? [], error, isLoading, mutate };
}

export function useJob(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ job: Job & { customer: Customer; quotes: Quote[]; invoices: Invoice[]; seaiProject: SeaiProject | null } }>(
    id ? `/api/jobs/${id}` : null,
    fetcher
  );
  return { job: data?.job, error, isLoading, mutate };
}

export function useQuotes() {
  const { data, error, isLoading, mutate } = useSWR<{ quotes: Quote[] }>('/api/quotes', fetcher);
  return { quotes: data?.quotes ?? [], error, isLoading, mutate };
}

export function useQuote(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ quote: Quote & { customer: Customer } }>(
    id ? `/api/quotes/${id}` : null,
    fetcher
  );
  return { quote: data?.quote, error, isLoading, mutate };
}

export function useInvoices() {
  const { data, error, isLoading, mutate } = useSWR<{ invoices: Invoice[] }>('/api/invoices', fetcher);
  return { invoices: data?.invoices ?? [], error, isLoading, mutate };
}

export function useInvoice(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ invoice: Invoice & { customer: Customer } }>(
    id ? `/api/invoices/${id}` : null,
    fetcher
  );
  return { invoice: data?.invoice, error, isLoading, mutate };
}

export function useSeaiProjects() {
  const { data, error, isLoading, mutate } = useSWR<{ projects: SeaiProject[] }>('/api/seai', fetcher);
  return { projects: data?.projects ?? [], error, isLoading, mutate };
}

export function useSeaiProject(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ project: SeaiProject }>(
    id ? `/api/seai/${id}` : null,
    fetcher
  );
  return { project: data?.project, error, isLoading, mutate };
}

export function useBusiness() {
  const { data, error, isLoading, mutate } = useSWR<{ business: Business }>('/api/business', fetcher);
  return { business: data?.business, error, isLoading, mutate };
}

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<{ stats: {
    customerCount: number; activeJobs: number; pendingQuotes: number;
    outstanding: number; overdue: number; paidThisMonth: number; seaiOpen: number;
    recentJobs: (Job & { customer: { name: string } })[];
  } }>('/api/stats', fetcher);
  return { stats: data?.stats, error, isLoading, mutate };
}

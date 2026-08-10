'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Lock } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useCart } from '@/lib/cart';
import { formatMoney } from '@/lib/utils';
import { shippingFor, storeConfig } from '@/lib/store.config';

type Customer = {
  email: string;
  name: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal: string;
  country: string;
};

const EMPTY: Customer = {
  email: '',
  name: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postal: '',
  country: '',
};

const REQUIRED: (keyof Customer)[] = ['email', 'name', 'address1', 'city', 'postal', 'country'];

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-content px-4 py-20 text-center text-neutral-400">Loading checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const { lines, subtotal, clear } = useCart();
  const router = useRouter();
  const params = useSearchParams();
  const [customer, setCustomer] = useState<Customer>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const valid = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(customer.email);
    return emailOk && REQUIRED.every((f) => customer[f].trim().length > 0);
  }, [customer]);

  const items = useMemo(
    () => lines.map((l) => ({ productId: l.productId, variant: l.variant, quantity: l.quantity })),
    [lines],
  );

  // Keep the latest payload in a ref so PayPal's createOrder closure never reads stale state.
  const payloadRef = useRef({ items, customer, valid });
  payloadRef.current = { items, customer, valid };

  useEffect(() => {
    if (lines.length === 0) router.replace('/cart');
  }, [lines.length, router]);

  function update(field: keyof Customer, value: string) {
    setCustomer((c) => ({ ...c, [field]: value }));
  }

  async function payWithStripe() {
    setTouched(true);
    setError(null);
    if (!valid) return;
    setBusy(true);
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed.');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  if (lines.length === 0) return null;

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-neutral-900">Checkout</h1>

      {params.get('cancelled') && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Payment was cancelled — your cart is still here whenever you&apos;re ready.
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Details form */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-neutral-900">Shipping details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" value={customer.name} onChange={(v) => update('name', v)} touched={touched} required span2 />
            <Field label="Email" type="email" value={customer.email} onChange={(v) => update('email', v)} touched={touched} required />
            <Field label="Phone (optional)" value={customer.phone} onChange={(v) => update('phone', v)} touched={touched} />
            <Field label="Address" value={customer.address1} onChange={(v) => update('address1', v)} touched={touched} required span2 />
            <Field label="Apartment, suite, etc. (optional)" value={customer.address2} onChange={(v) => update('address2', v)} touched={touched} span2 />
            <Field label="City" value={customer.city} onChange={(v) => update('city', v)} touched={touched} required />
            <Field label="State / Province" value={customer.state} onChange={(v) => update('state', v)} touched={touched} />
            <Field label="Postal code" value={customer.postal} onChange={(v) => update('postal', v)} touched={touched} required />
            <Field label="Country" value={customer.country} onChange={(v) => update('country', v)} touched={touched} required />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {/* Payment */}
          <h2 className="mb-4 mt-10 text-lg font-bold text-neutral-900">Payment</h2>
          <div className="space-y-4">
            <button
              onClick={payWithStripe}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <CreditCard className="h-5 w-5" />
              {busy ? 'Redirecting…' : 'Pay with card / Apple Pay'}
            </button>

            {paypalClientId ? (
              <div className="relative">
                <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
                  <span className="h-px flex-1 bg-neutral-200" /> or <span className="h-px flex-1 bg-neutral-200" />
                </div>
                <PayPalScriptProvider
                  options={{ clientId: paypalClientId, currency: storeConfig.currency.toUpperCase() }}
                >
                  <PayPalButtons
                    style={{ layout: 'horizontal', height: 48, tagline: false }}
                    forceReRender={[total, valid]}
                    onClick={(_, actions) => {
                      setTouched(true);
                      if (!payloadRef.current.valid) {
                        setError('Please complete your shipping details first.');
                        return actions.reject();
                      }
                      setError(null);
                      return actions.resolve();
                    }}
                    createOrder={async () => {
                      const { items, customer } = payloadRef.current;
                      const res = await fetch('/api/checkout/paypal/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items, customer }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'PayPal error');
                      return data.paypalOrderId as string;
                    }}
                    onApprove={async (data) => {
                      const res = await fetch('/api/checkout/paypal/capture', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paypalOrderId: data.orderID }),
                      });
                      const out = await res.json();
                      if (!res.ok) {
                        setError(out.error || 'Payment could not be completed.');
                        return;
                      }
                      clear();
                      router.push(`/order/success?ref=${out.reference}`);
                    }}
                    onError={() => setError('PayPal ran into a problem. Please try again.')}
                  />
                </PayPalScriptProvider>
              </div>
            ) : null}

            <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
              <Lock className="h-3.5 w-3.5" /> Payments are encrypted and processed securely.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h2 className="text-lg font-bold text-neutral-900">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3 text-sm">
                <span className="text-neutral-600">
                  {l.quantity}× {l.title}
                  {l.variant ? <span className="text-neutral-400"> ({l.variant})</span> : null}
                </span>
                <span className="font-medium">{formatMoney(l.unitPrice * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-medium">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd className="font-medium">{shipping === 0 ? 'Free' : formatMoney(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatMoney(total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  touched,
  required,
  type = 'text',
  span2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  touched: boolean;
  required?: boolean;
  type?: string;
  span2?: boolean;
}) {
  const invalid = required && touched && value.trim().length === 0;
  return (
    <label className={span2 ? 'sm:col-span-2' : ''}>
      <span className="mb-1 block text-sm font-medium text-neutral-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-200 ${
          invalid ? 'border-red-400' : 'border-neutral-300 focus:border-brand-500'
        }`}
      />
    </label>
  );
}

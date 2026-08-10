import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/cart';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { storeConfig } from '@/lib/store.config';

export const metadata: Metadata = {
  title: {
    default: `${storeConfig.name} — ${storeConfig.tagline}`,
    template: `%s · ${storeConfig.name}`,
  },
  description: storeConfig.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}

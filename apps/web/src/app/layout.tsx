import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Noto_Sans_Devanagari } from 'next/font/google';
import Providers from '@/components/Providers';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const noto = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-noto',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Digital Pavti Book — डिजिटल पावती बुक',
    template: '%s | Digital Pavti Book',
  },
  description:
    'Digital receipt management platform for Ganesh Mandals, Durga Puja Committees, Temple Trusts and all Indian community organizations. Generate, share and track donations digitally.',
  keywords: ['digital pavti', 'donation receipt', 'ganesh mandal', 'temple trust', 'pavti book', 'digital receipt india'],
  authors: [{ name: 'Digital Pavti Book' }],
  creator: 'Digital Pavti Book',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Pavti Book' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    title: 'Digital Pavti Book — डिजिटल पावती बुक',
    description: 'Digitize your donation receipts. Built for Indian community organizations.',
    siteName: 'Digital Pavti Book',
  },
};

export const viewport: Viewport = {
  themeColor: '#C85000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${noto.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#142d3d',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#ff6600', secondary: 'white' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

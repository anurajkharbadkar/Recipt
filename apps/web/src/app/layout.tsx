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
    default: 'e Pavti Book — ई पावती बुक',
    template: '%s | e Pavti Book',
  },
  description:
    'Digital receipt management platform for Ganesh Mandals, Durga Puja Committees, Temple Trusts and all Indian community organizations. Generate, share and track donations digitally.',
  keywords: ['e pavti book', 'digital pavti', 'donation receipt', 'ganesh mandal', 'temple trust', 'pavti book', 'digital receipt india'],
  authors: [{ name: 'e Pavti Book' }],
  creator: 'e Pavti Book',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'e Pavti Book' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    title: 'e Pavti Book — ई पावती बुक',
    description: 'Digitize your donation receipts. Built for Indian community organizations.',
    siteName: 'e Pavti Book',
  },
};

export const viewport: Viewport = {
  themeColor: '#592E09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${noto.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const theme = saved === 'dark' ? 'dark' : 'light';
                document.documentElement.classList.add(theme);
              } catch (_) {}
            `,
          }}
        />
      </head>
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
              success: { iconTheme: { primary: '#147214', secondary: 'white' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Noto_Sans_Devanagari } from 'next/font/google';
import Providers from '@/components/Providers';
import { Toaster } from 'react-hot-toast';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_TAGLINE_ALT } from '@pavti/shared';
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
    default: `${BRAND_NAME} — Digital Receipt & Collection Management`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    'Digital receipt and collection management for Mandals, trusts, NGOs and community organizations. Collect donations, issue QR-verified receipts, and track everything in one place.',
  keywords: ['e-pavti', 'e pavti book', 'digital pavti', 'donation receipt', 'mandal collection software', 'trust receipt management', 'ngo donation tracking', 'digital receipt india'],
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: BRAND_NAME },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    title: `${BRAND_NAME} — ${BRAND_TAGLINE_ALT}`,
    description: `${BRAND_TAGLINE} Digital receipt and collection management for Mandals, trusts, NGOs and community organizations.`,
    siteName: BRAND_NAME,
  },
};

export const viewport: Viewport = {
  // Matches --primary-brand-color's default in globals.css — the mobile
  // browser chrome tint should be the same brand accent as the rest of the
  // app, not an unrelated leftover color.
  themeColor: '#502000',
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

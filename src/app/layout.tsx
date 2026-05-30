import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'SparkLeads — Find 200+ Business Leads in 60 Seconds',
    template: '%s | SparkLeads',
  },
  description:
    'Type any business type and city. Get real phone numbers, emails, addresses instantly. Start outreach today. One-time $15. No monthly fees.',
  keywords: [
    'business leads',
    'lead generation',
    'business lead scraper',
    'business directory',
    'email finder',
    'phone number finder',
    'B2B leads',
    'outreach tool',
  ],
  authors: [{ name: 'SparkLeads' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'SparkLeads',
    title: 'SparkLeads — Find 200+ Business Leads in 60 Seconds',
    description:
      'Type any business type and city. Get real phone numbers, emails, addresses instantly. One-time $15.',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SparkLeads — Find 200+ Business Leads in 60 Seconds',
    description:
      'Type any business type and city. Get real phone numbers, emails, addresses instantly. One-time $15.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
        />
        {children}
      </body>
    </html>
  );
}

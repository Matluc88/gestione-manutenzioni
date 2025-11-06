import './globals.css';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import SessionProvider from '@/components/SessionProvider';
import { Toaster } from 'react-hot-toast';
import PWARegister from '@/components/PWARegister';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ONE-M ENERGY SOLUTIONS',
  description: 'Gestione Manutenzioni',
  manifest: '/manifest.json',
  themeColor: '#1e40af',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ONE-M Energy',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="it">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ONE-M Energy" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className}>
        <PWARegister />
        <SessionProvider session={session}>
          {children}
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}

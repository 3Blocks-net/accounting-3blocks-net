import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { Sidebar } from '@/components/layout/Sidebar';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: '3blocks · Wallet Accounting',
  description: 'Internal wallet accounting dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=chillax@500,600&display=swap"
        />
      </head>
      <body className="flex h-screen bg-background text-foreground antialiased">
        <Providers>
          <Sidebar />
          <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

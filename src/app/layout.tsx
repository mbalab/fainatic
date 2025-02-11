import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { RootLayout } from '@/components/layout/root';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fainatic - AI-powered Financial Insights',
  description:
    'Get smart financial insights from your bank statements with AI analysis',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootLayout>{children}</RootLayout>
      </body>
    </html>
  );
}

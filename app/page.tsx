import type { Metadata } from 'next';
import { HomePage } from '@/components/features/home/HomePage';

export const metadata: Metadata = {
  title: 'Fainatic - AI-powered Financial Analysis',
  description:
    'Get smart financial insights from your bank statements with AI analysis',
};

export const dynamic = 'force-static';
export const revalidate = 3600; // revalidate every hour

export default function Page() {
  return <HomePage />;
}

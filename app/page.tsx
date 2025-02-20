import {
  Hero,
  Features,
  UploadSection,
  Benefits,
  Pricing,
  FAQ,
} from '@/components/features/home';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fainatic - AI-powered Financial Analysis',
  description:
    'Get smart financial insights from your bank statements with AI analysis',
};

export const dynamic = 'force-static';
export const revalidate = 3600; // revalidate every hour

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <Features />
      <UploadSection />
      <Benefits />
      <Pricing />
      <FAQ />
    </main>
  );
}

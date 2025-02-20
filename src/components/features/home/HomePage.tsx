'use client';

import {
  Hero,
  Features,
  UploadSection,
  Benefits,
  Pricing,
  FAQ,
} from '@/components/features/home';

export function HomePage() {
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
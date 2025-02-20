import {
  Hero,
  Features,
  UploadSection,
  Benefits,
  Pricing,
  FAQ,
} from '@/components/features/home';

export const dynamic = 'force-static';
export const revalidate = 3600; // revalidate every hour

export default async function Page() {
  console.log('Rendering index page');

  return (
    <main>
      <Hero />
      <Features />
      <UploadSection />
      <Benefits />
      <Pricing />
      <FAQ />
    </main>
  );
}

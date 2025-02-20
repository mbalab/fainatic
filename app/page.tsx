import {
  Hero,
  Features,
  UploadSection,
  Benefits,
  Pricing,
  FAQ,
} from '@/components/features/home';

export default function Page() {
  console.log('Rendering index page');
  
  return (
    <>
      <Hero />
      <Features />
      <UploadSection />
      <Benefits />
      <Pricing />
      <FAQ />
    </>
  );
}

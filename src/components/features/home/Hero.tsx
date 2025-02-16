'use client';

import Image from 'next/image';

export const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 pt-14 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
          {/* Text content */}
          <div className="mx-auto max-w-2xl lg:col-span-6 lg:mx-0 lg:pt-4">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              AI-powered Financial Insights from Your Bank Statements
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Get instant analysis, personalized recommendations, and discover
              ways to optimize your finances with AI-powered insights.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <button
                onClick={() => scrollToSection('upload-section')}
                className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Upload Statement
              </button>
              <button
                onClick={() => scrollToSection('features-section')}
                className="text-lg font-semibold leading-6 text-gray-900 hover:text-gray-600 transition-colors"
              >
                Learn more <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {/* Preview image */}
          <div className="mx-auto mt-16 lg:col-span-6 lg:mt-0">
            <div className="rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/10">
              <Image
                src="/dashboard-preview.png"
                alt="App screenshot"
                width={1216}
                height={721}
                className="rounded-xl w-full"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

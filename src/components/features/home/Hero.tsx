import Image from 'next/image';
import Link from 'next/link';

export const Hero = () => {
  return (
    <div className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 pt-14 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
          {/* Текстовый контент */}
          <div className="mx-auto max-w-2xl lg:col-span-6 lg:mx-0 lg:pt-4">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              AI-powered Financial Insights from Your Bank Statements
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Get instant analysis, personalized recommendations, and discover
              ways to optimize your finances with AI-powered insights.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/upload"
                className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Upload Statement
              </Link>
              <Link
                href="/how-it-works"
                className="text-lg font-semibold leading-6 text-gray-900"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Изображение */}
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

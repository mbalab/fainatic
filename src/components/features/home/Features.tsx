import Image from 'next/image';

export const Features = () => {
  const features = [
    {
      title: 'Upload Statement',
      description:
        'Upload your bank statement in CSV, XLS/XLSX, PDF, or image format',
      icon: '/icons/upload.svg',
    },
    {
      title: 'Get Free Analysis',
      description:
        'Instantly see your spending patterns, income trends, and future wealth projections',
      icon: '/icons/analysis.svg',
    },
    {
      title: 'Unlock Insights',
      description:
        'Get personalized recommendations to optimize your finances for just $10',
      icon: '/icons/insights.svg',
    },
  ];

  return (
    <section id="features-section" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">
            How It Works
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Transform your finances in three simple steps
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center bg-white rounded-2xl p-8 shadow-sm ring-1 ring-gray-200"
              >
                <div className="mb-6">
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={48}
                    height={48}
                    className="h-12 w-12"
                  />
                </div>
                <dt className="text-xl font-semibold leading-7 text-gray-900">
                  {feature.title}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

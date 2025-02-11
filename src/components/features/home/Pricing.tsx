export const Pricing = () => {
  const tiers = [
    {
      name: 'Free Analysis',
      id: 'free',
      price: '$0',
      features: [
        'Basic spending analysis',
        'Income trends overview',
        'Monthly report',
        'Future wealth projections',
        'Category breakdown',
      ],
      cta: 'Start for free',
      ctaLink: '/upload',
    },
    {
      name: 'Full Report',
      id: 'premium',
      price: '$10',
      features: [
        'Everything in Free',
        'Personalized insights',
        'AI recommendations',
        'Optimization strategies',
        'Downloadable PDF report',
        'Email delivery',
      ],
      cta: 'Get full report',
      ctaLink: '/upload',
      highlighted: true,
    },
  ];

  return (
    <div className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">
            Pricing
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 xl:p-10 ${
                tier.highlighted
                  ? 'ring-2 ring-blue-600 shadow-xl'
                  : 'ring-1 ring-gray-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">
                    {tier.name}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {tier.highlighted
                    ? 'Get personalized insights and recommendations'
                    : 'Start with basic analysis'}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {tier.price}
                  </span>
                </p>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <svg
                        className="h-6 w-5 flex-none text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={tier.ctaLink}
                className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  tier.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: {
    monthly: number;
    yearly: number;
  };
  steps: string[];
  links: {
    title: string;
    url: string;
  }[];
}

interface Props {
  recommendations: {
    easy: Recommendation[];
    moderate: Recommendation[];
    significant: Recommendation[];
  };
  wealthForecasts: {
    withRecommendations: {
      easy: { years: number; amount: number }[];
      moderate: { years: number; amount: number }[];
      significant: { years: number; amount: number }[];
    };
  };
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const RecommendationCard: React.FC<{
  recommendation: Recommendation;
  type: 'easy' | 'moderate' | 'significant';
}> = ({ recommendation, type }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getTypeColor = () => {
    switch (type) {
      case 'easy':
        return 'text-green-600 bg-green-50';
      case 'moderate':
        return 'text-blue-600 bg-blue-50';
      case 'significant':
        return 'text-purple-600 bg-purple-50';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <span
              className={`inline-block px-2 py-1 rounded text-sm font-medium mb-2 ${getTypeColor()}`}
            >
              {type === 'easy'
                ? 'Easy Change'
                : type === 'moderate'
                  ? 'Moderate Change'
                  : 'Significant Change'}
            </span>
            <h3 className="text-lg font-semibold">{recommendation.title}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Monthly Impact</p>
            <p className="font-semibold text-green-600">
              {formatCurrency(recommendation.impact.monthly)}
            </p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-gray-700 mb-4">{recommendation.description}</p>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Implementation Steps:</h4>
            <ol className="list-decimal list-inside space-y-2">
              {recommendation.steps.map((step, index) => (
                <li key={index} className="text-gray-700">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {recommendation.links.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Useful Resources:</h4>
              <ul className="space-y-1">
                {recommendation.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Potential Annual Savings</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(recommendation.impact.yearly)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const PaidRecommendations: React.FC<Props> = ({
  recommendations,
  wealthForecasts,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-8">
          Your Personalized Financial Recommendations
        </h2>

        {/* Recommendations by difficulty */}
        <div className="space-y-8">
          {(['easy', 'moderate', 'significant'] as const).map((type) => (
            <div key={type}>
              <h3 className="text-xl font-semibold mb-4">
                {type === 'easy'
                  ? 'Easy Changes'
                  : type === 'moderate'
                    ? 'Moderate Changes'
                    : 'Significant Changes'}
              </h3>
              <div className="space-y-4">
                {recommendations[type].map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    type={type}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Wealth Forecasts */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-6">
            Potential Wealth Growth with Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['easy', 'moderate', 'significant'] as const).map((type) => (
              <div key={type} className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  {type === 'easy'
                    ? 'With Easy Changes'
                    : type === 'moderate'
                      ? 'With Moderate Changes'
                      : 'With Significant Changes'}
                </h4>
                {wealthForecasts.withRecommendations[type].map((forecast) => (
                  <div
                    key={forecast.years}
                    className="p-4 border rounded-lg bg-gray-50"
                  >
                    <p className="text-sm text-gray-600">
                      In {forecast.years} years
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(forecast.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

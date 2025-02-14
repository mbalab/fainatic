'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AnalysisResult, Recommendation } from '@/types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

type RecommendationAccordionProps = {
  recommendation: Recommendation;
};

const RecommendationAccordion = ({
  recommendation,
}: RecommendationAccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg mb-4">
      <button
        className="w-full px-4 py-3 text-left flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
          <div className="text-sm text-green-600">
            +${recommendation.impact.yearly.toLocaleString()} in a year
          </div>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t">
          <p className="text-gray-600 mb-4">{recommendation.description}</p>
          {recommendation.steps.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-900 mb-2">
                Steps to implement:
              </h5>
              <ol className="list-decimal list-inside space-y-2">
                {recommendation.steps.map((step, index) => (
                  <li key={index} className="text-gray-600">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {recommendation.links && recommendation.links.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Useful links:</h5>
              <ul className="space-y-2">
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
        </div>
      )}
    </div>
  );
};

const ErrorMessage = ({ error }: { error: string }) => {
  const errorMessages: { [key: string]: string } = {
    INVALID_STATEMENT_FORMAT:
      'The file could not be processed as a bank statement. Please check if you selected the correct file.',
    RATE_LIMIT_EXCEEDED:
      'The file is too large to process at the moment. Please try again with a smaller file or wait a few minutes.',
    INVALID_ANALYSIS_RESULT:
      'We were unable to analyze this bank statement. Please ensure the file contains valid transaction data.',
    ANALYSIS_FAILED:
      'An error occurred while analyzing your bank statement. Please try again later.',
    UNSUPPORTED_FILE_TYPE:
      'This file type is not supported. Please upload a CSV, Excel, or PDF file.',
    UPLOAD_FAILED: 'Failed to upload the file. Please try again.',
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-4 mb-4 text-red-800 bg-red-50 rounded-lg">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Analysis Error</span>
        </div>
        <p className="mt-2">
          {errorMessages[error] ||
            'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export const AnalysisResults = ({
  data,
  error,
}: {
  data?: AnalysisResult;
  error?: string | null;
}) => {
  const [isPremiumPurchased, setIsPremiumPurchased] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!data?.income || !data?.expenses) {
    return null;
  }

  const handlePurchasePremium = () => {
    // TODO: Integration with payment system
    setIsPremiumPurchased(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-12">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-12">
        Your Financial Analysis
      </h2>

      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Total Income
          </h3>
          <p className="text-3xl font-bold text-green-600">
            ${data.income.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Average ${data.income.monthlyAverage.toLocaleString()} / month
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Total Expenses
          </h3>
          <p className="text-3xl font-bold text-red-600">
            ${data.expenses.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Average ${data.expenses.monthlyAverage.toLocaleString()} / month
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cash Flow</h3>
          <p
            className={`text-3xl font-bold ${
              data.cashFlow.monthly >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ${data.cashFlow.monthly.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">Per month</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Income and expenses chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Income and Expenses Trends
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.income.trends.monthly.map((month, index) => ({
                  name: month.month,
                  income: month.amount,
                  expenses: data.expenses.trends.monthly[index].amount,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense categories pie chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Expense Structure
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expenses.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    name,
                    percent,
                  }: {
                    name: string;
                    percent: number;
                  }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {data.expenses.categories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Forecasts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-12">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Wealth Forecast
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.wealthForecasts.baseline.map((forecast) => (
            <div
              key={forecast.years}
              className="p-4 border rounded-lg bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">
                In {forecast.years} years
              </h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${forecast.amount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                With current cash flow
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Premium content */}
      {!isPremiumPurchased ? (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-xl shadow-lg mb-12">
          <h3 className="text-2xl font-bold mb-4">
            Get Personalized Recommendations
          </h3>
          <p className="mb-6">
            Learn how to increase your cash flow and achieve your financial
            goals faster with AI-powered personalized recommendations
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Specific steps to optimize expenses
            </li>
            <li className="flex items-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Income growth strategies
            </li>
            <li className="flex items-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Forecasts with recommendations
            </li>
          </ul>
          <button
            onClick={handlePurchasePremium}
            className="w-full sm:w-auto px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Get Recommendations for $10
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Recommendations by difficulty */}
          {(['easy', 'moderate', 'significant'] as const).map((level) => (
            <div
              key={level}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <h3 className="text-xl font-medium text-gray-900 mb-6">
                {level === 'easy'
                  ? 'Easy Changes'
                  : level === 'moderate'
                    ? 'Moderate Changes'
                    : 'Significant Changes'}
              </h3>
              <div className="space-y-4">
                {data.recommendations?.[level]?.map((recommendation) => (
                  <RecommendationAccordion
                    key={recommendation.id}
                    recommendation={recommendation}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Forecasts with recommendations */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-medium text-gray-900 mb-6">
              Forecast with Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(data.wealthForecasts.withRecommendations).map(
                ([level, forecasts]) => (
                  <div key={level}>
                    <h4 className="font-medium text-gray-900 mb-4">
                      {level === 'easy'
                        ? 'With Easy Changes'
                        : level === 'moderate'
                          ? 'With Moderate Changes'
                          : 'With Significant Changes'}
                    </h4>
                    {forecasts.map((forecast) => (
                      <div
                        key={forecast.years}
                        className="p-4 border rounded-lg bg-gray-50 mb-4"
                      >
                        <p className="text-sm text-gray-500">
                          In {forecast.years} years
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          ${forecast.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

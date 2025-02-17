'use client';

import React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { AnalysisResult, Recommendation, Category } from '@/types';
import { TooltipProps } from 'recharts';

type RecommendationAccordionProps = {
  recommendation: Recommendation;
};

const RecommendationAccordion = ({
  recommendation,
}: RecommendationAccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg mb-4 border-[#0037FF]">
      <button
        className="w-full px-4 py-3 text-left flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h4 className="font-medium text-[#2D3E4F]">{recommendation.title}</h4>
          <div className="text-sm text-[#0FB300]">
            +${recommendation.impact.yearly.toLocaleString()} in a year
          </div>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="#2D3E4F"
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
        <div className="px-4 py-3 border-t border-[#0037FF]">
          <p className="text-[#2D3E4F] opacity-80 mb-4">
            {recommendation.description}
          </p>
          {recommendation.steps.length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-[#2D3E4F] mb-2">
                Steps to implement:
              </h5>
              <ol className="list-decimal list-inside space-y-2">
                {recommendation.steps.map((step, index) => (
                  <li key={index} className="text-[#2D3E4F] opacity-80">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {recommendation.links && recommendation.links.length > 0 && (
            <div>
              <h5 className="font-medium text-[#2D3E4F] mb-2">Useful links:</h5>
              <ul className="space-y-2">
                {recommendation.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0037FF] hover:underline"
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

const CategoryAccordion = ({ category }: { category: Category }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        className="w-full px-3 py-2 text-left flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span className="font-medium text-[#2D3E4F]">{category.name}</span>
            <span className="text-[#2D3E4F]">${category.value.toFixed(2)}</span>
          </div>
          <div className="text-sm text-[#2D3E4F] opacity-60">
            {category.percentage.toFixed(1)}% of total
          </div>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="#2D3E4F"
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
        <div className="mt-2 pl-4">
          {category.counterparties.map(
            (counterparty: { name: string; total: number }, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center py-1 text-sm"
              >
                <span className="text-[#2D3E4F]">{counterparty.name}</span>
                <span className="text-[#2D3E4F] opacity-60">
                  ${counterparty.total.toFixed(2)}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

interface AnalysisResultsProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

type ValueType = string | number | Array<string | number>;
type NameType = string | number;

const formatter = (value: number) => {
  return value >= 0
    ? `+$${value.toLocaleString()}`
    : `-$${Math.abs(value).toLocaleString()}`;
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  isLoading,
  error,
}) => {
  const [isPremiumPurchased, setIsPremiumPurchased] = useState(false);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!result) {
    return null;
  }

  const { summary, reportInfo } = result;

  const handlePurchasePremium = () => {
    // TODO: Integration with payment system
    setIsPremiumPurchased(true);
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="flex-start" mb={4}>
        <Image
          src="/logo.svg"
          alt="Fainatic Logo"
          width={160}
          height={50}
          priority
        />
      </Box>
      <Grid container spacing={4}>
        {/* Report Info */}
        <Grid item xs={12}>
          <Card
            sx={{
              border: '1px solid #0037FF',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2D3E4F' }}>
                Report Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      Report Generated
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {reportInfo.generatedAt}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      First Transaction
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {reportInfo.firstTransactionDate}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      Last Transaction
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {reportInfo.lastTransactionDate}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      Analysis Period
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {Math.floor(reportInfo.periodInDays / 30)}{' '}
                      {Math.floor(reportInfo.periodInDays / 30) === 1
                        ? 'month'
                        : 'months'}{' '}
                      {reportInfo.periodInDays % 30}{' '}
                      {reportInfo.periodInDays % 30 === 1 ? 'day' : 'days'}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* General Statistics */}
        <Grid item xs={12}>
          <Card
            sx={{
              border: '1px solid #0037FF',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2D3E4F' }}>
                General Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      Total transactions
                    </Typography>
                    <Typography variant="h4">
                      {summary.totalTransactions}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      Total Income
                    </Typography>
                    <Typography variant="h4" color="#0FB300">
                      $
                      {summary.income.total.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      Total Expenses
                    </Typography>
                    <Typography variant="h4" color="#FF008C">
                      $
                      {summary.expenses.total.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      Average monthly income
                    </Typography>
                    <Typography variant="h4" color="#0FB300">
                      $
                      {summary.income.monthlyAverage.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      Average monthly expenses
                    </Typography>
                    <Typography variant="h4" color="#FF008C">
                      $
                      {summary.expenses.monthlyAverage.toLocaleString(
                        undefined,
                        { maximumFractionDigits: 0 }
                      )}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Income by category graph */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: '1px solid #0037FF',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              height: '100%',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2D3E4F' }}>
                Income by category
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.income.trends.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        'Amount',
                      ]}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#0FB300"
                      radius={[4, 4, 0, 0]}
                      filter="url(#shadow)"
                    >
                      <defs>
                        <filter id="shadow" height="200%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                        </filter>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box mt={2}>
                {summary.income.categories
                  .sort((a, b) => b.value - a.value)
                  .reduce((acc, category, index, array) => {
                    if (index < 5) {
                      // Add top 5 categories as usual
                      acc.push(
                        <div
                          key={index}
                          className="mb-3 p-3 bg-white rounded-lg border border-[#0037FF] hover:border-[#7700FF] transition-colors"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-[#2D3E4F]">
                              {category.name}
                            </span>
                            <div className="flex items-center gap-3">
                              {category.name !== 'Income' && (
                                <span className="text-sm text-[#2D3E4F] opacity-60">
                                  {category.percentage.toFixed(1)}%
                                </span>
                              )}
                              <span className="font-medium text-[#0FB300]">
                                $
                                {category.value.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {category.counterparties.map(
                              (counterparty, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="text-[#2D3E4F] opacity-80">
                                    {counterparty.name}
                                  </span>
                                  <span className="text-[#2D3E4F]">
                                    $
                                    {counterparty.total.toLocaleString(
                                      undefined,
                                      {
                                        maximumFractionDigits: 0,
                                      }
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    } else if (index === 5) {
                      // Create "Other" category for remaining categories
                      const otherCategories = array.slice(5);
                      const otherTotal = otherCategories.reduce(
                        (sum, cat) => sum + cat.value,
                        0
                      );
                      const totalSum = array.reduce(
                        (sum, cat) => sum + cat.value,
                        0
                      );
                      const otherPercentage = (otherTotal / totalSum) * 100;

                      acc.push(
                        <div
                          key="other"
                          className="mb-3 p-3 bg-white rounded-lg border border-[#0037FF] hover:border-[#7700FF] transition-colors"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-[#2D3E4F]">
                              Other
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-[#2D3E4F] opacity-60">
                                {otherPercentage.toFixed(1)}%
                              </span>
                              <span className="font-medium text-[#0FB300]">
                                $
                                {otherTotal.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {otherCategories.map((cat, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-[#2D3E4F] opacity-80">
                                  {cat.name}
                                </span>
                                <span className="text-[#2D3E4F]">
                                  $
                                  {cat.value.toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return acc;
                  }, [] as React.ReactNode[])}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Expenses by category graph */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              border: '1px solid #0037FF',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              height: '100%',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2D3E4F' }}>
                Expenses by category
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.expenses.trends.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        'Amount',
                      ]}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#FF008C"
                      radius={[4, 4, 0, 0]}
                      filter="url(#shadow2)"
                    >
                      <defs>
                        <filter id="shadow2" height="200%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                        </filter>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box mt={2}>
                {summary.expenses.categories.map((category, index) => (
                  <CategoryAccordion key={index} category={category} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Trends graph */}
        <Grid item xs={12}>
          <Card
            sx={{
              border: '1px solid #0037FF',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2D3E4F' }}>
                Trends
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={summary.expenses.trends.weekly}
                    margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
                      tickFormatter={(value) => value}
                      label={{
                        value: 'Weeks',
                        position: 'bottom',
                        offset: 10,
                        style: { fontSize: 12 },
                      }}
                      interval={2}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `$${value.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}`
                      }
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip
                      labelFormatter={(label: string, payload: Array<any>) =>
                        payload[0]?.payload?.date || ''
                      }
                      formatter={(value: ValueType) => [
                        formatter(value as number),
                        'Cash Flow',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#7700FF"
                      activeDot={{ r: 8 }}
                      dot={false}
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cash flow */}
        <Grid item xs={12}>
          <Card
            sx={{
              border: '1px solid #0037FF',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#2D3E4F' }}>
                {summary.cashFlow.monthly >= 0
                  ? 'Your wealth is increasing at the rate'
                  : 'Your wealth is decreasing at a rate'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      per Day
                    </Typography>
                    <Typography
                      variant="h4"
                      color={
                        summary.cashFlow.daily >= 0 ? '#0FB300' : '#FF008C'
                      }
                    >
                      $
                      {summary.cashFlow.daily.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      per Month
                    </Typography>
                    <Typography
                      variant="h4"
                      color={
                        summary.cashFlow.monthly >= 0 ? '#0FB300' : '#FF008C'
                      }
                    >
                      $
                      {summary.cashFlow.monthly.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      per Year
                    </Typography>
                    <Typography
                      variant="h4"
                      color={
                        summary.cashFlow.annual >= 0 ? '#0FB300' : '#FF008C'
                      }
                    >
                      $
                      {summary.cashFlow.annual.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Forecasts */}
      <Box mt={4} mb={4}>
        <Card
          sx={{
            border: '1px solid #0037FF',
            boxShadow:
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#2D3E4F' }}>
              Wealth forecast with current cash flow
            </Typography>
            <Grid container spacing={3}>
              {result.wealthForecasts.baseline.map((forecast) => (
                <Grid item xs={12} md={4} key={forecast.years}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" color="text.secondary">
                      In {forecast.years} years
                    </Typography>
                    <Typography
                      variant="h4"
                      color={forecast.amount >= 0 ? '#0FB300' : '#FF008C'}
                      sx={{ mt: 1 }}
                    >
                      $
                      {forecast.amount.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Premium content */}
      {!isPremiumPurchased ? (
        <div className="bg-gradient-to-r from-[#7700FF] to-[#0037FF] text-white p-8 rounded-xl shadow-lg mb-12">
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
            className="w-full sm:w-auto px-8 py-3 bg-white text-[#7700FF] rounded-lg font-medium hover:bg-opacity-90 transition-colors"
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
                {result.recommendations?.[level]?.map((recommendation) => (
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
              {Object.entries(result.wealthForecasts.withRecommendations).map(
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
    </Box>
  );
};

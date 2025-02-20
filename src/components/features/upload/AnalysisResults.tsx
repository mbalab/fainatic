'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AnalysisResult, Recommendation, Category, Transaction } from '@/types';
import { formatAmount } from '@/utils';

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
  transactions: Transaction[];
}

// Интерфейс для платного анализа
interface PaidAnalysis {
  recommendations: {
    easy: Recommendation[];
    moderate: Recommendation[];
    significant: Recommendation[];
  };
  insights: string[];
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  isLoading,
  error,
  transactions,
}) => {
  const [isPremiumPurchased, setIsPremiumPurchased] = useState(false);
  const [paidAnalysis, setPaidAnalysis] = useState<PaidAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchPaidAnalysis = useCallback(async () => {
    try {
      setIsLoadingAnalysis(true);
      setAnalysisError(null);

      const response = await fetch('/api/analysis/paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) {
        throw new Error('Failed to get analysis');
      }

      const data = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPaidAnalysis(data);
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [transactions]);

  useEffect(() => {
    console.log('Transactions received:', transactions);
  }, [transactions]);

  const categoryData = useMemo(() => {
    const categories = transactions.reduce(
      (acc, transaction) => {
        const { category, amount } = transaction;
        const categoryName = category || 'Other';
        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += Math.abs(amount);
        return acc;
      },
      {} as { [key: string]: number }
    );

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));
  }, [transactions]);

  const timelineData = useMemo(() => {
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sortedTransactions.map((t) => ({
      date: new Date(t.date).toLocaleDateString(),
      amount: t.amount,
    }));
  }, [transactions]);

  const financialMetrics = useMemo(() => {
    const startDate = new Date(
      Math.min(...transactions.map((t) => new Date(t.date).getTime()))
    );
    const endDate = new Date(
      Math.max(...transactions.map((t) => new Date(t.date).getTime()))
    );

    const totalDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    const totalMonths = totalDays / 30.44;

    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(
      transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const balance = income - expenses;
    const monthlyFlow = balance / totalMonths;
    const dailyFlow = balance / totalDays;

    const forecasts = [
      { years: 5, amount: monthlyFlow * 12 * 5 },
      { years: 10, amount: monthlyFlow * 12 * 10 },
      { years: 25, amount: monthlyFlow * 12 * 25 },
    ];

    return {
      income,
      expenses,
      balance,
      monthlyFlow,
      dailyFlow,
      forecasts,
      totalDays,
      totalMonths,
    };
  }, [transactions]);

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

  // Get currency from the first transaction with defined currency or use USD as default
  const currency = transactions[0]?.currency || 'USD';

  // Имитация оплаты (в будущем заменить на Stripe)
  const handlePurchasePremium = async () => {
    try {
      setIsLoadingAnalysis(true);

      // Увеличиваем задержку имитации оплаты до 2 секунд
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsPremiumPurchased(true);
      await fetchPaidAnalysis();
    } catch (error) {
      setAnalysisError('Ошибка при обработке оплаты');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">No transactions found</Typography>
      </Box>
    );
  }

  // Форматирование суммы с валютой
  const formatCurrencyAmount = (amount: number, currency?: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      RUB: '₽',
    };
    const currencySymbol = currency ? symbols[currency] || currency : '$';
    return `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Цвета для графиков
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
                      {summary.totalTransactions.toLocaleString()}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
                    <Typography color="textSecondary" variant="body2">
                      Total Income
                    </Typography>
                    <Typography variant="h4" color="#0FB300">
                      {formatAmount(summary.income.total, currency, {
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
                      {formatAmount(summary.expenses.total, currency, {
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
                      {formatAmount(summary.income.monthlyAverage, currency, {
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
                      {formatAmount(summary.expenses.monthlyAverage, currency, {
                        maximumFractionDigits: 0,
                      })}
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
                    <defs>
                      <filter
                        id="income-shadow"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation="2"
                          floodOpacity="0.1"
                        />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        formatAmount(value as number, currency),
                        'Amount',
                      ]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#0FB300"
                      radius={[4, 4, 0, 0]}
                      filter="url(#income-shadow)"
                    />
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
                                {formatAmount(category.value, currency, {
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
                                    {formatAmount(
                                      counterparty.total,
                                      currency,
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
                                {formatAmount(otherTotal, currency, {
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
                                  {formatAmount(cat.value, currency, {
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
                    <defs>
                      <filter
                        id="expenses-shadow"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation="2"
                          floodOpacity="0.1"
                        />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        formatAmount(value as number, currency),
                        'Amount',
                      ]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#FF008C"
                      radius={[4, 4, 0, 0]}
                      filter="url(#expenses-shadow)"
                    />
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
                        formatAmount(value as number, currency)
                      }
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip
                      labelFormatter={(label: string, payload: Array<any>) =>
                        payload[0]?.payload?.date || ''
                      }
                      formatter={(value: any) => [
                        formatAmount(value as number, currency),
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
                      {formatAmount(summary.cashFlow.daily, currency, {
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
                      {formatAmount(summary.cashFlow.monthly, currency, {
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
                      {formatAmount(summary.cashFlow.annual, currency, {
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

      {/* Финансовый обзор */}
      <Card sx={{ mb: 4, border: '1px solid #0037FF' }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: '#2D3E4F', mb: 3 }}
          >
            Финансовый обзор
          </Typography>

          <Grid container spacing={3}>
            {/* Основные метрики */}
            <Grid item xs={12} md={6} lg={3}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <Typography color="textSecondary">Общий доход</Typography>
                </div>
                <Typography variant="h5" sx={{ color: 'green' }}>
                  {formatCurrencyAmount(financialMetrics.income, currency)}
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4m8 0l4-4m0 8l-4-4"
                    />
                  </svg>
                  <Typography color="textSecondary">Общий расход</Typography>
                </div>
                <Typography variant="h5" sx={{ color: 'red' }}>
                  {formatCurrencyAmount(financialMetrics.expenses, currency)}
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <Typography color="textSecondary">Месячный поток</Typography>
                </div>
                <Typography
                  variant="h5"
                  sx={{
                    color: financialMetrics.monthlyFlow >= 0 ? 'green' : 'red',
                  }}
                >
                  {formatCurrencyAmount(financialMetrics.monthlyFlow, currency)}
                </Typography>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <Typography color="textSecondary">Дневной поток</Typography>
                </div>
                <Typography
                  variant="h5"
                  sx={{
                    color: financialMetrics.dailyFlow >= 0 ? 'green' : 'red',
                  }}
                >
                  {formatCurrencyAmount(financialMetrics.dailyFlow, currency)}
                </Typography>
              </Card>
            </Grid>

            {/* Прогнозы */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 2, color: '#2D3E4F' }}>
                Прогноз благосостояния
              </Typography>
              {financialMetrics.monthlyFlow < 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <Typography color="error">
                      Внимание: Отрицательный денежный поток может привести к
                      финансовым трудностям
                    </Typography>
                  </div>
                </div>
              )}
              <Grid container spacing={3}>
                {financialMetrics.forecasts.map((forecast) => (
                  <Grid item xs={12} md={4} key={forecast.years}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        <Typography color="textSecondary">
                          Через {forecast.years} лет
                        </Typography>
                      </div>
                      <Typography
                        variant="h5"
                        sx={{ color: forecast.amount >= 0 ? 'green' : 'red' }}
                      >
                        {formatCurrencyAmount(forecast.amount, currency)}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
                      {formatAmount(forecast.amount, currency, {
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

      {/* Блок AI-анализа */}
      <Card sx={{ mb: 4, border: '1px solid #0037FF' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: '#2D3E4F' }}>
            AI-анализ и рекомендации
          </Typography>

          {!isPremiumPurchased ? (
            <div className="bg-gradient-to-r from-[#7700FF] to-[#0037FF] text-white p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">
                Получите персональный AI-анализ
              </h3>
              <p className="mb-6">
                Наш искусственный интеллект проанализирует ваши транзакции и
                предложит персональные рекомендации для улучшения финансового
                состояния
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
                  Детальный анализ расходов
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
                  Персональные рекомендации по оптимизации
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
                  Прогноз с учетом рекомендаций
                </li>
              </ul>
              <button
                onClick={handlePurchasePremium}
                disabled={isLoadingAnalysis}
                className="w-full sm:w-auto px-8 py-3 bg-white text-[#7700FF] rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingAnalysis ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#7700FF]"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Обработка...
                  </span>
                ) : (
                  'Получить анализ за $10'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {isLoadingAnalysis ? (
                <div className="flex justify-center items-center py-12">
                  <CircularProgress />
                </div>
              ) : analysisError ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                  {analysisError}
                </div>
              ) : paidAnalysis ? (
                <>
                  {/* Основные выводы */}
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="text-lg font-medium text-blue-900 mb-4">
                      Основные выводы
                    </h4>
                    <ul className="space-y-2">
                      {paidAnalysis.insights.map((insight, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-blue-800"
                        >
                          <svg
                            className="w-5 h-5 mt-1 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Рекомендации по уровням сложности */}
                  {(['easy', 'moderate', 'significant'] as const).map(
                    (level) => (
                      <div
                        key={level}
                        className="bg-white p-6 rounded-lg border"
                      >
                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                          {level === 'easy'
                            ? 'Простые изменения'
                            : level === 'moderate'
                              ? 'Умеренные изменения'
                              : 'Значительные изменения'}
                        </h4>
                        <div className="space-y-4">
                          {paidAnalysis.recommendations[level].map(
                            (recommendation) => (
                              <div
                                key={recommendation.id}
                                className="p-4 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-grow">
                                    <h5 className="font-medium text-gray-900">
                                      {recommendation.title}
                                    </h5>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {recommendation.description}
                                    </p>
                                    {recommendation.impact && (
                                      <p className="text-green-600 text-sm mt-2">
                                        Потенциальная экономия:{' '}
                                        {formatCurrencyAmount(
                                          recommendation.impact.monthly,
                                          currency
                                        )}{' '}
                                        в месяц
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Таблица транзакций */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transactions
          </Typography>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Counterparty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={
                          transaction.amount >= 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {formatCurrencyAmount(
                          transaction.amount,
                          transaction.currency
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.currency || 'USD'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.counterparty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Графики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Столбчатая диаграмма */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Amounts by Category
            </Typography>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Круговая диаграмма */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {categoryData.map((entry, index) => (
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
          </CardContent>
        </Card>
      </div>

      {/* Временная шкала */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Transaction Timeline
          </Typography>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

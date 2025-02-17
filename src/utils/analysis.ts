import type { Transaction, AnalysisResult } from '@/types';
import {
  format,
  parseISO,
  differenceInMonths,
  differenceInDays,
} from 'date-fns';
import { logger } from '@/utils/logger';

// Helper to group transactions by category
const groupByCategory = (transactions: Transaction[]) => {
  const groups = new Map<string, Transaction[]>();

  // Group transactions by category
  transactions.forEach((transaction) => {
    const currentGroup = groups.get(transaction.category) || [];
    currentGroup.push(transaction);
    groups.set(transaction.category, currentGroup);
  });

  // Calculate totals and percentages
  const totalAmount = Math.abs(
    transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  );

  return Array.from(groups.entries()).map(([category, transactions]) => {
    const total = Math.abs(
      transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    );

    // Group by counterparty within category
    const counterpartyGroups = new Map<string, number>();
    transactions.forEach((t) => {
      const currentTotal = counterpartyGroups.get(t.counterparty) || 0;
      counterpartyGroups.set(t.counterparty, currentTotal + Math.abs(t.amount));
    });

    // Convert to array and sort by total
    const counterparties = Array.from(counterpartyGroups.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    return {
      name: category,
      value: total,
      percentage: (total / totalAmount) * 100,
      trend: calculateTrend(transactions),
      counterparties,
    };
  });
};

// Helper to calculate trend
const calculateTrend = (
  transactions: Transaction[]
): 'up' | 'down' | 'stable' => {
  if (transactions.length < 2) return 'stable';

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstHalf = sortedTransactions.slice(
    0,
    Math.floor(transactions.length / 2)
  );
  const secondHalf = sortedTransactions.slice(
    Math.floor(transactions.length / 2)
  );

  const firstHalfAvg =
    firstHalf.reduce((sum, t) => sum + t.amount, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, t) => sum + t.amount, 0) / secondHalf.length;

  const difference = secondHalfAvg - firstHalfAvg;
  const threshold = Math.abs(firstHalfAvg) * 0.1; // 10% threshold

  if (Math.abs(difference) < threshold) return 'stable';
  return difference > 0 ? 'up' : 'down';
};

// Helper to calculate monthly trends
const calculateMonthlyTrends = (transactions: Transaction[]) => {
  const monthlyAmounts = new Map<string, number>();

  transactions.forEach((transaction) => {
    const monthKey = format(parseISO(transaction.date), 'yyyy-MM');
    const currentAmount = monthlyAmounts.get(monthKey) || 0;
    monthlyAmounts.set(monthKey, currentAmount + transaction.amount);
  });

  return Array.from(monthlyAmounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month: format(parseISO(`${month}-01`), 'MMM yyyy'),
      amount,
    }));
};

// Helper to calculate weekly cash flow
const calculateWeeklyCashFlow = (transactions: Transaction[]) => {
  const weeklyAmounts = new Map<string, number>();
  const weekDates = new Map<string, string>();

  transactions.forEach((transaction) => {
    const date = parseISO(transaction.date);
    const weekKey = format(date, 'yyyy-ww');
    const currentAmount = weeklyAmounts.get(weekKey) || 0;
    weeklyAmounts.set(weekKey, currentAmount + transaction.amount);
    if (!weekDates.has(weekKey)) {
      weekDates.set(weekKey, format(date, 'MMM d, yyyy'));
    }
  });

  return Array.from(weeklyAmounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, amount]) => ({
      week: week.split('-')[1],
      date: weekDates.get(week),
      amount,
    }));
};

// Main analysis function
export const analyzeTransactions = (
  transactions: Transaction[]
): AnalysisResult => {
  try {
    logger.debug('Starting transaction analysis');

    if (!transactions.length) {
      throw new Error('No transactions to analyze');
    }

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get date range
    const startDate = parseISO(sortedTransactions[0].date);
    const endDate = parseISO(
      sortedTransactions[sortedTransactions.length - 1].date
    );
    const monthsCount = differenceInMonths(endDate, startDate) + 1;

    // Calculate report info
    const reportInfo = {
      generatedAt: format(new Date(), 'yyyy-MM-dd'),
      firstTransactionDate: format(startDate, 'yyyy-MM-dd'),
      lastTransactionDate: format(endDate, 'yyyy-MM-dd'),
      periodInMonths: monthsCount,
      periodInDays: differenceInDays(endDate, startDate) + 1,
    };

    // Split transactions into income and expenses
    const incomeTransactions = transactions.filter((t) => t.amount > 0);
    const expenseTransactions = transactions.filter((t) => t.amount < 0);

    // Calculate totals
    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const totalExpenses = Math.abs(
      expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
    );

    // Calculate monthly averages
    const monthlyIncomeAvg = totalIncome / (reportInfo.periodInDays / 30.44); // average days in month
    const monthlyExpensesAvg =
      totalExpenses / (reportInfo.periodInDays / 30.44);
    const monthlyCashFlow = monthlyIncomeAvg - monthlyExpensesAvg;
    const dailyCashFlow =
      (totalIncome - totalExpenses) / reportInfo.periodInDays;

    return {
      transactions,
      reportInfo,
      summary: {
        totalTransactions: transactions.length,
        income: {
          total: totalIncome,
          monthlyAverage: monthlyIncomeAvg,
          categories: groupByCategory(incomeTransactions),
          trends: {
            monthly: calculateMonthlyTrends(incomeTransactions),
          },
        },
        expenses: {
          total: totalExpenses,
          monthlyAverage: monthlyExpensesAvg,
          categories: groupByCategory(expenseTransactions),
          trends: {
            monthly: calculateMonthlyTrends(expenseTransactions),
            weekly: calculateWeeklyCashFlow(transactions),
          },
        },
        cashFlow: {
          monthly: monthlyCashFlow,
          annual: monthlyCashFlow * 12,
          daily: dailyCashFlow,
        },
      },
      wealthForecasts: {
        baseline: [
          {
            years: 5,
            amount: monthlyCashFlow * 12 * 5,
            monthlyContribution: monthlyCashFlow,
          },
          {
            years: 10,
            amount: monthlyCashFlow * 12 * 10,
            monthlyContribution: monthlyCashFlow,
          },
          {
            years: 25,
            amount: monthlyCashFlow * 12 * 25,
            monthlyContribution: monthlyCashFlow,
          },
        ],
        withRecommendations: {},
      },
      recommendations: {},
    };
  } catch (error) {
    logger.error('Error in analyzeTransactions', error);
    throw error;
  }
};

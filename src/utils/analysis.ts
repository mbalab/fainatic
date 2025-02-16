import { Transaction, AnalysisResult } from '@/types';
import {
  format,
  parseISO,
  differenceInMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

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

    return {
      name: category,
      value: total,
      percentage: (total / totalAmount) * 100,
      trend: calculateTrend(transactions),
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

// Main analysis function
export const analyzeTransactions = (
  transactions: Transaction[]
): AnalysisResult => {
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

  // Split transactions into income and expenses
  const incomeTransactions = transactions.filter((t) => t.amount > 0);
  const expenseTransactions = transactions.filter((t) => t.amount < 0);

  // Calculate totals
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(
    expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
  );

  // Calculate monthly averages
  const monthlyIncomeAvg = totalIncome / monthsCount;
  const monthlyExpensesAvg = totalExpenses / monthsCount;
  const monthlyCashFlow = monthlyIncomeAvg - monthlyExpensesAvg;

  return {
    transactions,
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
        },
      },
      cashFlow: {
        monthly: monthlyCashFlow,
        annual: monthlyCashFlow * 12,
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
};

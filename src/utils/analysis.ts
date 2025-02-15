import { Transaction, BasicAnalysis, CategoryGroup } from '@/types/analysis';

// Helper to group transactions by category
const groupByCategory = (transactions: Transaction[]): CategoryGroup[] => {
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
      total,
      percentage: (total / totalAmount) * 100,
      transactions,
    };
  });
};

// Calculate monthly cash flow
const calculateMonthlyFlow = (transactions: Transaction[]): number => {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Get number of months between first and last transaction
  const dates = transactions.map((t) => new Date(t.date));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const months =
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
    (maxDate.getMonth() - minDate.getMonth()) +
    1;

  return totalAmount / months;
};

// Calculate wealth forecasts
const calculateForecasts = (monthlyFlow: number) => {
  const annualFlow = monthlyFlow * 12;

  return {
    years5: annualFlow * 5,
    years10: annualFlow * 10,
    years25: annualFlow * 25,
  };
};

// Main analysis function
export const analyzeTransactions = (
  transactions: Transaction[]
): BasicAnalysis => {
  // Sort transactions by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate basic metrics
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const monthlyFlow = calculateMonthlyFlow(transactions);
  const categories = groupByCategory(transactions);
  const forecasts = calculateForecasts(monthlyFlow);

  // Get date range
  const dateRange = {
    from: sortedTransactions[0].date,
    to: sortedTransactions[sortedTransactions.length - 1].date,
  };

  return {
    totalIncome,
    totalExpenses,
    monthlyFlow,
    categories,
    forecasts,
    dateRange,
  };
};

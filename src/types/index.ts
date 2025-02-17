export * from './analysis';

export interface Transaction {
  date: string;
  amount: number;
  currency?: string;
  counterparty: string;
  category: string;
}

export type TransactionCategory =
  | 'Income'
  | 'Shopping'
  | 'Transport'
  | 'Food'
  | 'Entertainment'
  | 'Other';

export type Category = {
  name: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  counterparties: Array<{
    name: string;
    total: number;
  }>;
};

export type Recommendation = {
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
};

export type WealthForecast = {
  years: number;
  amount: number;
  monthlyContribution: number;
};

export type AnalysisResult = {
  transactions: Transaction[];
  reportInfo: {
    generatedAt: string;
    firstTransactionDate: string;
    lastTransactionDate: string;
    periodInMonths: number;
    periodInDays: number;
  };
  summary: {
    totalTransactions: number;
    income: {
      total: number;
      monthlyAverage: number;
      categories: Category[];
      trends: {
        monthly: Array<{
          month: string;
          amount: number;
        }>;
      };
    };
    expenses: {
      total: number;
      monthlyAverage: number;
      categories: Category[];
      trends: {
        monthly: Array<{
          month: string;
          amount: number;
        }>;
        weekly: Array<{
          week: string;
          amount: number;
        }>;
      };
    };
    cashFlow: {
      monthly: number;
      annual: number;
      daily: number;
    };
  };
  wealthForecasts: {
    baseline: WealthForecast[];
    withRecommendations: {
      [key: string]: WealthForecast[];
    };
  };
  recommendations: {
    [key: string]: Recommendation[];
  };
};

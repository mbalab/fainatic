export type AnalysisResult = {
  totalTransactions: number;
  income: {
    total: number;
    categories: Array<{
      name: string;
      amount: number;
    }>;
  };
  expenses: {
    total: number;
    categories: Array<{
      name: string;
      amount: number;
    }>;
  };
  dateRange: {
    from: string;
    to: string;
  };
};

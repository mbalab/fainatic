export type AnalysisResult = {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  dateRange: {
    from: string;
    to: string;
  };
};

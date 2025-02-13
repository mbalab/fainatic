export type Category = {
  name: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  description?: string;
};

export type WealthForecast = {
  years: number;
  amount: number;
  monthlyFlow: number;
  scenarios: {
    baseline: number;
    withRecommendations: {
      easy: number;
      moderate: number;
      significant: number;
    };
  };
};

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  impact: {
    monthly: number;
    yearly: number;
  };
  difficulty: 'easy' | 'moderate' | 'significant';
  steps: string[];
  links?: Array<{
    title: string;
    url: string;
  }>;
};

export type AnalysisResult = {
  totalTransactions: number;
  income: {
    total: number;
    categories: Category[];
    monthlyAverage: number;
    trends: {
      monthly: Array<{
        month: string;
        amount: number;
      }>;
    };
  };
  expenses: {
    total: number;
    categories: Category[];
    monthlyAverage: number;
    trends: {
      monthly: Array<{
        month: string;
        amount: number;
      }>;
    };
  };
  cashFlow: {
    monthly: number;
    trends: {
      monthly: Array<{
        month: string;
        amount: number;
      }>;
    };
  };
  dateRange: {
    from: string;
    to: string;
  };
  wealthForecasts: {
    baseline: WealthForecast[];
    withRecommendations: {
      easy: WealthForecast[];
      moderate: WealthForecast[];
      significant: WealthForecast[];
    };
  };
  recommendations?: {
    easy: Recommendation[];
    moderate: Recommendation[];
    significant: Recommendation[];
  };
};

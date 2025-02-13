import { AnalysisResult } from '@/types';

export const AnalysisResults = ({ data }: { data: AnalysisResult }) => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Your Financial Analysis
      </h2>
      {/* Здесь будет расширенный UI с графиками и платным контентом */}
      <div className="mt-8">
        {/* Пока оставим базовый результат */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Transactions</span>
              <span className="text-sm font-medium">
                {data.totalTransactions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Income</span>
              <span className="text-sm font-medium text-green-600">
                ${data.income.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Expenses</span>
              <span className="text-sm font-medium text-red-600">
                ${data.expenses.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-8">
        {/* Основные метрики */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Summary</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm text-gray-500">Income Categories</h4>
              {data.income.categories.map((cat) => (
                <div key={cat.name} className="flex justify-between mt-2">
                  <span className="text-sm text-gray-900">{cat.name}</span>
                  <span className="text-sm font-medium text-green-600">
                    ${cat.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm text-gray-500">Expense Categories</h4>
              {data.expenses.categories.map((cat) => (
                <div key={cat.name} className="flex justify-between mt-2">
                  <span className="text-sm text-gray-900">{cat.name}</span>
                  <span className="text-sm font-medium text-red-600">
                    ${cat.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

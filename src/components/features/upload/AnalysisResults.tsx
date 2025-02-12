import { AnalysisResult } from './types';

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
          {/* ... существующий код отображения результатов ... */}
        </div>
      </div>
    </div>
  );
};

import OpenAI from 'openai';
import { AnalysisResult } from '@/types';

const logger = {
  error: (message: string, ...args: unknown[]) =>
    console.error(message, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(message, ...args),
};

// Добавим проверку наличия ключа
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

logger.warn('API Key starts with:', process.env.OPENAI_API_KEY.substring(0, 7));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Добавим логирование для отладки
export const analyzeWithGPT4 = async (
  fileContent: string,
  fileType: string
): Promise<AnalysisResult> => {
  logger.warn('API Key length:', process.env.OPENAI_API_KEY?.length);
  logger.warn('File content type:', typeof fileContent);
  logger.warn('File content preview:', fileContent.substring(0, 100));

  const prompt = `
    You are a financial expert analyzing a bank statement. The statement is in ${fileType} format.
    Analyze the transactions and provide a comprehensive financial analysis with the following requirements:

    1. Calculate total income and expenses
    2. Categorize all transactions into meaningful categories
    3. Calculate monthly averages and trends
    4. Provide wealth forecasts for 5, 10, and 25 years
    5. Generate personalized recommendations in three categories:
       - Easy changes (minimal lifestyle impact)
       - Moderate changes (some lifestyle adjustments)
       - Significant changes (major lifestyle changes)
    6. For each recommendation, include:
       - Specific steps for implementation
       - Expected monthly and yearly impact
       - Relevant links to services or resources
    7. Calculate how implementing recommendations would affect long-term wealth

    Return the analysis in a strict JSON format matching this TypeScript type:

    type AnalysisResult = {
      totalTransactions: number;
      income: {
        total: number;
        categories: Array<{
          name: string;
          amount: number;
          percentage: number;
          trend: 'up' | 'down' | 'stable';
          description?: string;
        }>;
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
        categories: Array<{
          name: string;
          amount: number;
          percentage: number;
          trend: 'up' | 'down' | 'stable';
          description?: string;
        }>;
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
        baseline: Array<{
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
        }>;
        withRecommendations: {
          easy: Array<{
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
          }>;
          moderate: Array<{
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
          }>;
          significant: Array<{
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
          }>;
        };
      };
      recommendations?: {
        easy: Array<{
          id: string;
          title: string;
          description: string;
          impact: {
            monthly: number;
            yearly: number;
          };
          difficulty: 'easy';
          steps: string[];
          links?: Array<{
            title: string;
            url: string;
          }>;
        }>;
        moderate: Array<{
          id: string;
          title: string;
          description: string;
          impact: {
            monthly: number;
            yearly: number;
          };
          difficulty: 'moderate';
          steps: string[];
          links?: Array<{
            title: string;
            url: string;
          }>;
        }>;
        significant: Array<{
          id: string;
          title: string;
          description: string;
          impact: {
            monthly: number;
            yearly: number;
          };
          difficulty: 'significant';
          steps: string[];
          links?: Array<{
            title: string;
            url: string;
          }>;
        }>;
      };
    };

    Ensure all numerical values are realistic and properly calculated.
    Make recommendations specific and actionable, with real-world services and resources where applicable.
    DO NOT include any explanatory text outside the JSON structure.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-0125-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a financial analysis expert. Analyze bank statements with high accuracy and provide actionable insights.',
        },
        { role: 'user', content: prompt },
        { role: 'user', content: fileContent },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result as AnalysisResult;
  } catch (error) {
    logger.error('OpenAI error:', error);
    throw error;
  }
};

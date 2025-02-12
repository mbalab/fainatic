import OpenAI from 'openai';

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
) => {
  logger.warn('API Key length:', process.env.OPENAI_API_KEY?.length);
  logger.warn('File content type:', typeof fileContent);
  logger.warn('File content preview:', fileContent.substring(0, 100));

  const prompt = `
    Analyze this ${fileType} bank statement and provide a JSON response in this exact format:
    {
      "metrics": {
        "totalTransactions": number,
        "income": { "total": number, "categories": Array<{name: string, amount: number}> },
        "expenses": { "total": number, "categories": Array<{name: string, amount: number}> }
      },
      "insights": string[],
      "recommendations": string[]
    }

    DO NOT include any additional text or explanations.
    DO NOT modify the response format.
    If you can't analyze the file, return { "error": "specific error message" }
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
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    logger.warn('GPT response:', result);
    return result;
  } catch (error) {
    logger.error('OpenAI error:', error);
    throw error;
  }
};

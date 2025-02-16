import OpenAI from 'openai';
import { AnalysisResult } from '@/types';

const logger = {
  error: (message: string, ...args: unknown[]) =>
    console.error(message, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(message, ...args),
};

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 120000, // Increased timeout for OCR processing
});

// Check if the file is an image
const isImageFile = (fileType: string): boolean => {
  return fileType.startsWith('image/');
};

// Check if the file is a PDF
const isPDFFile = (fileType: string): boolean => {
  return fileType === 'application/pdf';
};

// Check if the file is a CSV
const isCSVFile = (fileType: string): boolean => {
  return fileType === 'text/csv';
};

// Check if the file is an Excel file
const isExcelFile = (fileType: string): boolean => {
  return (
    fileType ===
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
};

// Check if base64 encoding is needed
const needsBase64Encoding = (fileType: string): boolean => {
  return isImageFile(fileType) || isPDFFile(fileType);
};

const extractTransactionsWithGPT4 = async (
  fileContent: Buffer,
  fileType: string,
  fileName: string
) => {
  // Определяем формат контента в зависимости от типа файла
  const content = needsBase64Encoding(fileType)
    ? fileContent.toString('base64')
    : fileContent.toString('utf-8');

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a financial data extraction expert. Extract transactions from bank statements and return them as JSON.
Focus on finding:
- Transaction dates
- Descriptions
- Amounts
- Credit/Debit indicators

For CSV files:
- Look for common patterns in bank statements
- First row might contain headers
- Common headers: Date, Description/Narrative, Debit, Credit, Amount
- Handle different date formats
- Negative amounts usually mean expenses
- Positive amounts usually mean income

For Excel files:
- Similar to CSV but might have multiple sheets
- Look for sheets with transaction data
- Headers are usually in the first row
- May contain formatting and formulas (ignore them)

Return data in this JSON format:
{
  "fileFormat": "pdf|csv|xlsx",
  "extractionMethod": "direct",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number,
      "type": "income|expense"
    }
  ]
}

If you cannot find any transactions, return this JSON:
{"error": "NO_TRANSACTIONS_FOUND", "details": "reason"}

If the content appears to be binary/non-text data, return this JSON:
{"error": "BINARY_CONTENT", "details": "Content appears to be non-text data"}`,
      },
      {
        role: 'user',
        content: `Extract transactions from this bank statement and return as JSON:

File type: ${fileType}
Filename: ${fileName}
Content:

${content}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};

const extractTransactionsWithVision = async (
  fileContent: Buffer,
  fileType: string,
  fileName: string
) => {
  const content = fileContent.toString('base64');

  // Используем прямой вызов API для Vision
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v1',
    },
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: `You are a financial data extraction expert with OCR capabilities. Extract transactions from bank statement images and return them as JSON.
Focus on finding:
- Transaction dates
- Descriptions
- Amounts
- Credit/Debit indicators

Return data in this JSON format:
{
  "fileFormat": "pdf|image",
  "extractionMethod": "ocr",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number,
      "type": "income|expense"
    }
  ]
}

If you cannot find any transactions, return this JSON:
{"error": "NO_TRANSACTIONS_FOUND", "details": "reason"}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract transactions from this bank statement image and return as JSON:

File type: ${fileType}
Filename: ${fileName}

Look for:
1. Tables with transaction data
2. Date patterns (DD/MM/YYYY, MM/DD/YYYY, etc.)
3. Amount patterns (currency symbols, numbers with decimals)
4. Transaction descriptions

Return the result in the specified JSON format.`,
            },
            {
              type: 'image',
              image_url: {
                url: `data:${fileType};base64,${content}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    logger.error('Vision API error:', error);
    throw new Error('VISION_API_ERROR');
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content || '{}');
};

export const analyzeWithGPT4 = async (
  fileContent: Buffer,
  fileType: string,
  fileName: string
): Promise<AnalysisResult> => {
  logger.warn('Processing file:', {
    fileType,
    fileName,
    contentLength: fileContent.length,
  });

  try {
    let extractionResult;

    // Determine file processing strategy
    if (isImageFile(fileType)) {
      // For images, use Vision API directly
      logger.warn('Processing image file with Vision API');
      extractionResult = await extractTransactionsWithVision(
        fileContent,
        fileType,
        fileName
      );
    } else if (isPDFFile(fileType)) {
      // For PDF, first try standard GPT-4
      logger.warn('Attempting to process PDF with standard GPT-4');
      try {
        extractionResult = await extractTransactionsWithGPT4(
          fileContent,
          fileType,
          fileName
        );
      } catch (error) {
        // If standard GPT-4 fails, try Vision API
        logger.warn(
          'Standard GPT-4 failed for PDF, falling back to Vision API',
          error
        );
        extractionResult = await extractTransactionsWithVision(
          fileContent,
          fileType,
          fileName
        );
      }
    } else if (isCSVFile(fileType) || isExcelFile(fileType)) {
      // For CSV and Excel files, use standard GPT-4 with text content
      logger.warn(
        `Processing ${isCSVFile(fileType) ? 'CSV' : 'Excel'} file with standard GPT-4`
      );
      extractionResult = await extractTransactionsWithGPT4(
        fileContent,
        fileType,
        fileName
      );
    } else {
      throw new Error('Unsupported file type');
    }

    // Проверяем результат извлечения данных
    if (extractionResult.error) {
      throw new Error(extractionResult.error);
    }

    // Анализируем извлеченные транзакции
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a financial analysis expert. Analyze the provided transaction data and generate comprehensive financial insights as JSON.
Focus on:
- Categorizing transactions accurately
- Calculating totals and averages
- Identifying trends and patterns
- Ensuring all calculations are accurate`,
        },
        {
          role: 'user',
          content: `Please analyze these transactions and provide detailed financial insights in JSON format:

${JSON.stringify(extractionResult, null, 2)}

Return the analysis in this JSON format:
{
  "totalTransactions": number,
  "income": {
    "total": number,
    "categories": [{ "name": string, "amount": number, "percentage": number, "trend": "up" | "down" | "stable" }],
    "monthlyAverage": number,
    "trends": { "monthly": [{ "month": string, "amount": number }] }
  },
  "expenses": {
    "total": number,
    "categories": [{ "name": string, "amount": number, "percentage": number, "trend": "up" | "down" | "stable" }],
    "monthlyAverage": number,
    "trends": { "monthly": [{ "month": string, "amount": number }] }
  },
  "cashFlow": {
    "monthly": number,
    "trends": { "monthly": [{ "month": string, "amount": number }] }
  },
  "dateRange": { "from": string, "to": string }
}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Check if analysis failed
    if (result.error) {
      throw new Error(result.error);
    }

    // Get recommendations in a separate call
    const recommendationsResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a financial advisor providing personalized recommendations based on transaction analysis. Return recommendations as JSON.',
        },
        {
          role: 'user',
          content: `Based on this financial analysis, provide recommendations in JSON format:
${JSON.stringify(result, null, 2)}

Return recommendations in this JSON format:
{
  "recommendations": {
    "easy": [{
      "id": string,
      "title": string,
      "description": string,
      "impact": { "monthly": number, "yearly": number },
      "steps": string[],
      "links": [{ "title": string, "url": string }]
    }],
    "moderate": [...],
    "significant": [...]
  },
  "wealthForecasts": {
    "baseline": [{ "years": number, "amount": number, "monthlyFlow": number }],
    "withRecommendations": {
      "easy": [...],
      "moderate": [...],
      "significant": [...]
    }
  }
}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const recommendations = JSON.parse(
      recommendationsResponse.choices[0].message.content || '{}'
    );

    return {
      ...result,
      ...recommendations,
    } as AnalysisResult;
  } catch (error) {
    logger.error('OpenAI error:', error);

    if (error instanceof Error) {
      if (error.message.includes('rate_limit_exceeded')) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      if (
        error.message === 'INVALID_STATEMENT_FORMAT' ||
        error.message === 'NO_TRANSACTIONS_FOUND' ||
        error.message === 'BINARY_CONTENT' ||
        error.message === 'VISION_API_ERROR'
      ) {
        throw new Error(error.message);
      }
      if (error.message.includes('timeout')) {
        throw new Error('ANALYSIS_TIMEOUT');
      }
    }

    throw new Error('ANALYSIS_FAILED');
  }
};

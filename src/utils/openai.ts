import OpenAI from 'openai';
import type { Transaction, AnalysisResult } from '@/types';
import { logger } from '@/utils/logger';

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
  transactions: Transaction[],
  fileType?: string,
  fileName?: string
): Promise<AnalysisResult> => {
  logger.debug('Starting GPT-4 analysis', {
    transactionsCount: transactions.length,
    fileType,
    fileName,
  });

  try {
    // Convert transactions to CSV format for GPT
    const csvHeader = 'date,amount,currency,counterparty,category\n';
    const csvRows = transactions
      .map(
        (t) =>
          `${t.date},${t.amount},${t.currency},${t.counterparty},${t.category}`
      )
      .join('\n');
    const csvData = csvHeader + csvRows;

    // Get recommendations from GPT-4
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a financial advisor analyzing transaction data to provide personalized recommendations.
Focus on:
1. Identifying spending patterns and potential areas for optimization
2. Suggesting specific, actionable steps to improve financial health
3. Providing realistic estimates of potential savings

For each difficulty level (easy, moderate, significant):
- Provide exactly 3 recommendations
- Each recommendation should include:
  - Clear title
  - Detailed description
  - Estimated monthly and yearly impact
  - Specific implementation steps
  - Relevant resources or links

Return the analysis in this JSON format:
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
    "withRecommendations": {
      "easy": [{ "years": number, "amount": number }],
      "moderate": [...],
      "significant": [...]
    }
  }
}`,
        },
        {
          role: 'user',
          content: `Analyze these transactions and provide personalized recommendations:

${csvData}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    logger.debug('Analysis completed successfully');

    return analysis;
  } catch (error) {
    logger.error('Error in GPT-4 analysis:', error);
    throw error;
  }
};

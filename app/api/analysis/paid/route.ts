import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transactions, sessionId } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Invalid transaction data' },
        { status: 400 }
      );
    }

    // Verify that payment was successful
    // TODO: Implement payment verification using sessionId

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

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in paid analysis:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

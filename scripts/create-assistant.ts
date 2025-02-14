import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createAssistant() {
  try {
    const assistant = await openai.beta.assistants.create({
      name: 'Financial Document Analyzer',
      description: 'Analyzes bank statements and financial documents',
      model: 'gpt-4-1106-preview',
      tools: [{ type: 'code_interpreter' }],
      instructions: `You are a financial analysis expert. Your task is to analyze bank statements and provide detailed financial insights.
      Always return analysis results in the following JSON format:
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
        "dateRange": { "from": string, "to": string },
        "wealthForecasts": {
          "baseline": [{ "years": number, "amount": number, "monthlyFlow": number }],
          "withRecommendations": {
            "easy": [{ "years": number, "amount": number, "monthlyFlow": number }],
            "moderate": [{ "years": number, "amount": number, "monthlyFlow": number }],
            "significant": [{ "years": number, "amount": number, "monthlyFlow": number }]
          }
        },
        "recommendations": {
          "easy": [{
            "id": string,
            "title": string,
            "description": string,
            "impact": { "monthly": number, "yearly": number },
            "steps": string[],
            "links": [{ "title": string, "url": string }]
          }],
          "moderate": [{
            "id": string,
            "title": string,
            "description": string,
            "impact": { "monthly": number, "yearly": number },
            "steps": string[],
            "links": [{ "title": string, "url": string }]
          }],
          "significant": [{
            "id": string,
            "title": string,
            "description": string,
            "impact": { "monthly": number, "yearly": number },
            "steps": string[],
            "links": [{ "title": string, "url": string }]
          }]
        }
      }`,
    });

    console.log('Assistant created successfully!');
    console.log('Assistant ID:', assistant.id);
    console.log(
      'Please save this ID in your environment variables as OPENAI_ASSISTANT_ID'
    );
  } catch (error) {
    console.error('Error creating assistant:', error);
  }
}

createAssistant();

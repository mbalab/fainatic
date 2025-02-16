# Fainatic

A modern web service for analyzing bank statements using AI technology.

## Features

- **File Upload**: Support for multiple formats (CSV, XLS/XLSX, PDF, images)
- **Automated Analysis**: Quick processing of financial data
- **Free Analysis**:
  - Transaction categorization
  - Income and expense breakdown
  - Monthly cash flow analysis
  - 5, 10, and 25-year wealth forecasts
- **Premium Analysis** ($10):
  - AI-powered personalized recommendations
  - Expense optimization strategies
  - Income growth opportunities
  - Detailed implementation steps

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI Integration**: OpenAI GPT-4
- **File Processing**: CSV, Excel, PDF parsing
- **Data Visualization**: Recharts
- **Payment Processing**: Stripe
- **State Management**: Zustand
- **Form Handling**: React Hook Form
- **Validation**: Zod

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/mbalab/fainatic.git
   cd fainatic
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Fill in the required API keys in `.env.local`

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Required environment variables:

- `OPENAI_API_KEY` - OpenAI API key for GPT-4
- `STRIPE_SECRET_KEY` - Stripe secret key for payments
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `NEXT_PUBLIC_APP_URL` - Your application URL

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

// Currency symbols mapping
const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  RUB: '₽',
};

/**
 * Format amount with currency symbol
 * @param amount - Numeric amount to format
 * @param currency - ISO currency code (optional)
 * @param options - Intl.NumberFormat options
 * @returns Formatted string with currency symbol
 */
export const formatAmount = (
  amount: number,
  currency?: string,
  options: Intl.NumberFormatOptions = {}
): string => {
  if (!currency) {
    return amount.toLocaleString(undefined, options);
  }

  const symbol = currencySymbols[currency];
  if (symbol) {
    return `${symbol}${amount.toLocaleString(undefined, options)}`;
  }

  return `${currency} ${amount.toLocaleString(undefined, options)}`;
};

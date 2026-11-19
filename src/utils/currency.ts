// Currency conversion utilities
// Approximate conversion rate: 1 USD = 15,500 IDR

export type Currency = 'USD' | 'IDR';

const USD_TO_IDR_RATE = 15500;

export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'IDR') return amount * USD_TO_IDR_RATE;
  if (from === 'IDR' && to === 'USD') return amount / USD_TO_IDR_RATE;
  return amount;
}

export function formatCurrency(amount: number, currency: Currency, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
}): string {
  const converted = convertCurrency(amount, 'USD', currency);
  
  if (currency === 'IDR') {
    // Format as Indonesian Rupiah
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  }
  
  // Format as USD
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(converted);
}

export function formatCurrencyCompact(amount: number, currency: Currency): string {
  const converted = convertCurrency(amount, 'USD', currency);
  
  if (currency === 'IDR') {
    // For compact IDR, use abbreviated format
    if (converted >= 1e12) return `Rp ${(converted / 1e12).toFixed(1)}T`;
    if (converted >= 1e9) return `Rp ${(converted / 1e9).toFixed(1)}B`;
    if (converted >= 1e6) return `Rp ${(converted / 1e6).toFixed(1)}M`;
    if (converted >= 1e3) return `Rp ${(converted / 1e3).toFixed(1)}K`;
    return `Rp ${Math.round(converted).toLocaleString('id-ID')}`;
  }
  
  // For compact USD
  if (converted >= 1e12) return `$${(converted / 1e12).toFixed(2)}T`;
  if (converted >= 1e9) return `$${(converted / 1e9).toFixed(2)}B`;
  if (converted >= 1e6) return `$${(converted / 1e6).toFixed(2)}M`;
  if (converted >= 1e3) return `$${(converted / 1e3).toFixed(2)}K`;
  return `$${converted.toFixed(2)}`;
}

export function getCurrencySymbol(currency: Currency): string {
  return currency === 'IDR' ? 'Rp' : '$';
}
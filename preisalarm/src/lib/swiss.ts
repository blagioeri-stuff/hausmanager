// Approximate ECB reference rates to CHF
// Update periodically or override via settings (key: 'currencyRates' JSON)
const DEFAULT_RATES_TO_CHF: Record<string, number> = {
  CHF: 1.0,
  EUR: 0.94,
  USD: 0.88,
  GBP: 1.13,
  SEK: 0.082,
  NOK: 0.083,
  DKK: 0.126,
};

export function convertToChf(amount: number, currency: string): number {
  const rate = DEFAULT_RATES_TO_CHF[currency.toUpperCase()] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

export interface SwissImportCost {
  totalWithoutDuty: number;
  estimatedDuty: number;
  estimatedVat: number;
  totalWithDuty: number;
  dutyApplies: boolean;
}

/**
 * Estimate total import cost for non-CH goods.
 * - Goods <= CHF 300 total value (incl. shipping): only 8.1% MWST
 * - Goods > CHF 300: MWST + ~2.5% customs + CHF 17.50 PostCH handling fee
 */
export function estimateSwissImportCost(
  priceChf: number,
  shippingChf = 15
): SwissImportCost {
  const totalValue = priceChf + shippingChf;
  const dutyApplies = totalValue > 300;

  if (!dutyApplies) {
    const vat = Math.round(totalValue * 0.081 * 100) / 100;
    return {
      totalWithoutDuty: totalValue,
      estimatedDuty: 0,
      estimatedVat: vat,
      totalWithDuty: Math.round((totalValue + vat) * 100) / 100,
      dutyApplies: false,
    };
  }

  const customsRate = 0.025;
  const duty = Math.round(totalValue * customsRate * 100) / 100;
  const handlingFee = 17.5;
  const vat = Math.round((totalValue + duty) * 0.081 * 100) / 100;

  return {
    totalWithoutDuty: totalValue,
    estimatedDuty: Math.round((duty + handlingFee) * 100) / 100,
    estimatedVat: vat,
    totalWithDuty: Math.round((totalValue + duty + handlingFee + vat) * 100) / 100,
    dutyApplies: true,
  };
}

export function formatPrice(amount: number, currency = 'CHF'): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

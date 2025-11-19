/**
 * Format price values with appropriate decimal precision based on magnitude
 * Handles small altcoin prices (< $0.01) with up to 8 decimal places
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) {
    return '$0.00';
  }

  // For very small prices (< $0.01), show up to 8 significant decimals
  if (price < 0.01) {
    // Find first non-zero decimal
    const str = price.toFixed(10);
    const match = str.match(/\.0*[1-9]/);
    if (match) {
      const zerosAfterDecimal = match[0].length - 2; // Subtract dot and first digit
      const decimals = Math.min(zerosAfterDecimal + 6, 8); // Show 6 more digits after first non-zero
      return `$${price.toFixed(decimals)}`;
    }
    return `$${price.toFixed(8)}`;
  }
  
  // For prices between $0.01 and $1, show 4 decimals
  if (price < 1) {
    return `$${price.toFixed(4)}`;
  }
  
  // For prices between $1 and $1000, show 2 decimals with comma separators
  if (price < 1000) {
    return `$${price.toFixed(2)}`;
  }
  
  // For prices >= $1000, use locale string with 2 decimals
  return `$${price.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Format percentage change with appropriate precision
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format volume with K/M/B suffixes
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }
  return volume.toFixed(0);
}

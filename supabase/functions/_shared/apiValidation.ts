/**
 * API Response Validation Schemas
 * Validates external API responses before processing
 */

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

// Coinglass Response Schema
export interface CoinglassResponse<T = any> {
  code: string;
  msg?: string;
  data: T;
  success?: boolean;
}

// Validate Coinglass response structure
export function validateCoinglassResponse<T>(
  response: any,
  dataValidator?: (data: T) => string[]
): ValidationResult<T> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check response object exists
  if (!response || typeof response !== 'object') {
    errors.push('Invalid response: not an object');
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  if (!('code' in response)) {
    errors.push('Missing required field: code');
  }

  if (!('data' in response)) {
    errors.push('Missing required field: data');
  }

  // Validate code field
  if (response.code !== '0' && response.code !== 0) {
    const errorMsg = response.msg || 'Unknown error';
    errors.push(`API error code ${response.code}: ${errorMsg}`);
    
    // Check for specific error patterns
    if (errorMsg.toLowerCase().includes('upgrade')) {
      warnings.push('API plan upgrade required for this endpoint');
    }
    if (errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('invalid symbol')) {
      warnings.push('Symbol not supported by this endpoint');
    }
  }

  // Validate data field
  if (response.data === null || response.data === undefined) {
    errors.push('Data field is null or undefined');
  }

  // Custom data validation
  if (dataValidator && response.data) {
    const dataErrors = dataValidator(response.data);
    errors.push(...dataErrors);
  }

  return {
    isValid: errors.length === 0,
    data: response.data,
    errors,
    warnings,
  };
}

// Validate array data (e.g., historical data)
export function validateArrayData(data: any, minLength = 1): string[] {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Data is not an array');
    return errors;
  }

  if (data.length < minLength) {
    errors.push(`Insufficient data: expected at least ${minLength} items, got ${data.length}`);
  }

  return errors;
}

// Validate OHLC data structure
export function validateOHLCData(data: any[]): string[] {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('OHLC data is not an array');
    return errors;
  }

  for (let i = 0; i < Math.min(3, data.length); i++) {
    const item = data[i];
    const requiredFields = ['time', 'open', 'high', 'low', 'close'];
    
    for (const field of requiredFields) {
      if (!(field in item)) {
        errors.push(`Missing required OHLC field '${field}' in data item ${i}`);
      } else if (field !== 'time' && (isNaN(parseFloat(item[field])) || item[field] === null)) {
        errors.push(`Invalid numeric value for '${field}' in data item ${i}`);
      }
    }
  }

  return errors;
}

// Validate liquidation data
export function validateLiquidationData(data: any[]): string[] {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Liquidation data is not an array');
    return errors;
  }

  for (let i = 0; i < Math.min(3, data.length); i++) {
    const item = data[i];
    const hasLongLiq = 'long_liquidation_usd' in item || 'longLiquidation' in item;
    const hasShortLiq = 'short_liquidation_usd' in item || 'shortLiquidation' in item;
    
    if (!hasLongLiq && !hasShortLiq) {
      errors.push(`Missing liquidation fields in data item ${i}`);
    }
    
    if (!('time' in item)) {
      errors.push(`Missing 'time' field in data item ${i}`);
    }
  }

  return errors;
}

// CoinMarketCap validation
export function validateCMCQuote(data: any): ValidationResult<any> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Invalid CMC quote: not an object');
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  const requiredFields = ['symbol', 'name', 'quote'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate quote structure
  if (data.quote && typeof data.quote === 'object') {
    const usdQuote = data.quote.USD;
    if (!usdQuote) {
      errors.push('Missing USD quote data');
    } else {
      const priceFields = ['price', 'volume_24h', 'market_cap', 'percent_change_24h'];
      for (const field of priceFields) {
        if (usdQuote[field] === null || usdQuote[field] === undefined) {
          warnings.push(`Missing or null field in quote: ${field}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    data,
    errors,
    warnings,
  };
}

// Create user-friendly error message
export function createErrorResponse(
  type: 'funding_rate' | 'open_interest' | 'liquidations' | 'quote',
  symbol: string,
  errors: string[],
  warnings: string[]
): any {
  console.error(`Validation failed for ${type} [${symbol}]:`, { errors, warnings });

  const baseResponse = {
    message: `Derivatives data not available for this symbol`,
    unavailable: true,
    isMockData: false,
    errors,
    warnings,
  };

  // Type-specific fallback structures
  switch (type) {
    case 'funding_rate':
      return {
        ...baseResponse,
        current: {
          rate: 'N/A',
          rateValue: 0,
          sentiment: 'UNAVAILABLE',
          nextFunding: new Date(Date.now() + 8 * 3600000).toISOString(),
        },
        history: [],
      };

    case 'open_interest':
      return {
        ...baseResponse,
        total: {
          value: 'N/A',
          valueRaw: 0,
          change24h: 'N/A',
          sentiment: 'UNAVAILABLE',
        },
        history: [],
        byExchange: [],
      };

    case 'liquidations':
      return {
        ...baseResponse,
        last24h: {
          totalLongs: 'N/A',
          totalShorts: 'N/A',
          total: 'N/A',
          ratio: 'N/A',
          longShortRatio: 'N/A',
          majorEvents: [],
        },
        recentLiquidations: [],
        heatmap: { levels: [] },
      };

    case 'quote':
      return {
        ...baseResponse,
        symbol,
        name: symbol,
        price: 0,
        marketCap: 0,
        volume24h: 0,
        percentChange24h: 0,
      };

    default:
      return baseResponse;
  }
}

// Log validation results for monitoring
export function logValidationResult(
  endpoint: string,
  symbol: string,
  result: ValidationResult<any>
): void {
  if (!result.isValid) {
    console.error(`❌ Validation FAILED [${endpoint}] ${symbol}:`, {
      errors: result.errors,
      warnings: result.warnings,
    });
  } else if (result.warnings.length > 0) {
    console.warn(`⚠️  Validation warnings [${endpoint}] ${symbol}:`, result.warnings);
  } else {
    console.log(`✅ Validation passed [${endpoint}] ${symbol}`);
  }
}

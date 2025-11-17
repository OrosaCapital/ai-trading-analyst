import { ReactNode } from 'react';

/**
 * TRADING LAYOUT FILE
 * 
 * This file contains all sections of the trading interface and their functions.
 * Each section is clearly defined with its purpose and responsibilities.
 */

interface TradingLayoutProps {
  children: ReactNode;
}

/**
 * SECTION 1: Main Layout Container
 * Function: Provides the overall structure and background for the trading interface
 */
export const TradingLayout = ({ children }: TradingLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
};

interface HeaderSectionProps {
  title?: string;
  subtitle?: string;
  isLive?: boolean;
}

/**
 * SECTION 2: Header Section
 * Function: Displays app branding, title, and live status indicator
 */
export const HeaderSection = ({ 
  title = "OCAPX", 
  subtitle = "AI Trading Terminal",
  isLive = true 
}: HeaderSectionProps) => {
  return (
    <header className="glass-strong border-b border-border/30 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="text-3xl font-black text-accent drop-shadow-[0_0_20px_hsl(var(--accent)/0.6)]">
              {title}
            </div>
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent/50"></div>
          </div>
          <div className="h-6 w-px bg-border/50"></div>
          <span className="text-sm font-medium text-muted-foreground">{subtitle}</span>
        </div>
        
        {isLive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow"></div>
              <span className="text-muted-foreground">LIVE</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

interface SymbolInputSectionProps {
  children: ReactNode;
}

/**
 * SECTION 3: Symbol Input Section
 * Function: Contains the main input area for users to enter trading symbols
 * Includes title, description, input field, and quick access symbols
 */
export const SymbolInputSection = ({ children }: SymbolInputSectionProps) => {
  return (
    <div className="glass rounded-2xl p-8 space-y-6 animate-fade-in">
      {children}
    </div>
  );
};

interface ChartSectionProps {
  symbol: string;
  currentPrice?: number;
  priceChange?: number;
  isConnected?: boolean;
  nextUpdateIn?: number;
  children: ReactNode;
}

/**
 * SECTION 4: Chart Section
 * Function: Displays the main trading chart with price information and real-time updates
 * Includes: Symbol title, current price, price change, connection status, and chart component
 */
export const ChartSection = ({ 
  symbol,
  currentPrice,
  priceChange,
  isConnected,
  nextUpdateIn,
  children 
}: ChartSectionProps) => {
  return (
    <div className="glass rounded-2xl p-6 space-y-4 animate-fade-in-up">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{symbol}</h2>
          {currentPrice && currentPrice > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-foreground">
                ${currentPrice.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
              {priceChange !== undefined && (
                <span className={`text-sm font-semibold ${
                  priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
                </span>
              )}
              {isConnected !== undefined && (
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-muted-foreground/30'
                }`} />
              )}
            </div>
          )}
        </div>
        {nextUpdateIn !== undefined && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Next update in {nextUpdateIn}s</span>
          </div>
        )}
      </div>

      {/* Chart Component */}
      <div className="rounded-xl overflow-hidden">
        {children}
      </div>
    </div>
  );
};

interface MarketMetricsSectionProps {
  children: ReactNode;
  title?: string;
  delay?: string;
}

/**
 * SECTION 5: Market Metrics Section
 * Function: Displays various market metrics and indicators
 * Examples: Funding rate, open interest, liquidations, long/short ratio
 */
export const MarketMetricsSection = ({ 
  children, 
  title = "Live Market Metrics",
  delay = "0.2s" 
}: MarketMetricsSectionProps) => {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: delay }}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

interface AnalysisSectionProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  delay?: string;
}

/**
 * SECTION 6: AI Analysis Section
 * Function: Displays AI-generated trading analysis, signals, and recommendations
 * Includes: Signal strength, sentiment analysis, confidence levels, and detailed insights
 */
export const AnalysisSection = ({ 
  children, 
  title = "AI Analysis",
  icon,
  delay = "0.3s" 
}: AnalysisSectionProps) => {
  return (
    <div className="glass rounded-2xl p-8 space-y-6 animate-scale-in" style={{ animationDelay: delay }}>
      {title && (
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              {icon}
            </div>
          )}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
};

interface ContentContainerProps {
  children: ReactNode;
}

/**
 * SECTION 7: Main Content Container
 * Function: Wraps all content sections with proper spacing and constraints
 */
export const ContentContainer = ({ children }: ContentContainerProps) => {
  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {children}
    </div>
  );
};

/**
 * SECTION 8: Error Display Component
 * Function: Shows error messages in a consistent, styled format
 */
interface ErrorDisplayProps {
  message: string;
}

export const ErrorDisplay = ({ message }: ErrorDisplayProps) => {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-400">{message}</span>
      </div>
    </div>
  );
};

/**
 * SECTION 9: Loading State Component
 * Function: Shows loading state with animation
 */
interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Loading..." }: LoadingStateProps) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

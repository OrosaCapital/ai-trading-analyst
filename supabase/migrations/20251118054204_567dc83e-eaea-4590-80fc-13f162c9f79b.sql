-- Add analysis_method column to track how the signal was generated
ALTER TABLE ai_trading_signals 
ADD COLUMN IF NOT EXISTS analysis_method TEXT DEFAULT 'AI_ONLY';

-- Add comment for documentation
COMMENT ON COLUMN ai_trading_signals.analysis_method IS 'Values: LOCAL_ENGINE (free), AI_ENHANCED (minimal credits), AI_ONLY (legacy)';
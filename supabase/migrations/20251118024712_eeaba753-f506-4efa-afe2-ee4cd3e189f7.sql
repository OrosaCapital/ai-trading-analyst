-- Create watchlist tables
CREATE TABLE public.user_watchlists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  nickname text,
  notes text,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  added_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id, symbol)
);

-- Create analysis schedule tracking table
CREATE TABLE public.watchlist_analysis_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id uuid REFERENCES public.user_watchlists(id) ON DELETE CASCADE NOT NULL,
  last_analysis_run timestamp with time zone,
  next_scheduled_run timestamp with time zone,
  analysis_frequency text DEFAULT 'manual' CHECK (analysis_frequency IN ('15min', '30min', '1hr', '4hr', 'manual')),
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(watchlist_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_analysis_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_watchlists
CREATE POLICY "Users can view own watchlists"
  ON public.user_watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlists"
  ON public.user_watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists"
  ON public.user_watchlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists"
  ON public.user_watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for watchlist_analysis_schedule
CREATE POLICY "Users can view own schedules"
  ON public.watchlist_analysis_schedule FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_watchlists
      WHERE id = watchlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own schedules"
  ON public.watchlist_analysis_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_watchlists
      WHERE id = watchlist_id AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_user_watchlists_user_id ON public.user_watchlists(user_id);
CREATE INDEX idx_user_watchlists_symbol ON public.user_watchlists(symbol);
CREATE INDEX idx_watchlist_schedule_watchlist_id ON public.watchlist_analysis_schedule(watchlist_id);

-- Update existing AI analysis tables to support user_id
ALTER TABLE public.ai_analysis_history 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS watchlist_id uuid REFERENCES public.user_watchlists(id) ON DELETE SET NULL;

ALTER TABLE public.ai_trading_signals
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS watchlist_id uuid REFERENCES public.user_watchlists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS was_executed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS execution_notes text;

-- Create indexes on analysis tables
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON public.ai_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_symbol ON public.ai_analysis_history(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_signals_user_id ON public.ai_trading_signals(user_id);
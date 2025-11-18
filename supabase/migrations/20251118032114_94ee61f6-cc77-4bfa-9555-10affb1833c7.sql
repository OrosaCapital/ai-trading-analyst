-- Enable RLS on user_watchlists if not already enabled
ALTER TABLE public.user_watchlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view their own watchlist" ON public.user_watchlists;
DROP POLICY IF EXISTS "Users can insert their own watchlist items" ON public.user_watchlists;
DROP POLICY IF EXISTS "Users can update their own watchlist items" ON public.user_watchlists;
DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON public.user_watchlists;

-- Allow users to view their own watchlist items
CREATE POLICY "Users can view their own watchlist"
ON public.user_watchlists
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own watchlist items
CREATE POLICY "Users can insert their own watchlist items"
ON public.user_watchlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own watchlist items
CREATE POLICY "Users can update their own watchlist items"
ON public.user_watchlists
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own watchlist items
CREATE POLICY "Users can delete their own watchlist items"
ON public.user_watchlists
FOR DELETE
USING (auth.uid() = user_id);
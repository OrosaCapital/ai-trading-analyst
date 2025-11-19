-- Enable realtime for funding rates and market snapshots
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_funding_rates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_snapshots;
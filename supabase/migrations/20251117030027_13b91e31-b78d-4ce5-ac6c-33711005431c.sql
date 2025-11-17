-- Analysis cache table for intelligent caching
CREATE TABLE analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text UNIQUE NOT NULL,
  symbol text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '5 minutes')
);

-- Indexes for fast lookups
CREATE INDEX idx_query_hash ON analysis_cache(query_hash);
CREATE INDEX idx_expires_at ON analysis_cache(expires_at);

-- Enable RLS (public access for MVP)
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON analysis_cache
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON analysis_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete for cleanup" ON analysis_cache
  FOR DELETE USING (expires_at < now());
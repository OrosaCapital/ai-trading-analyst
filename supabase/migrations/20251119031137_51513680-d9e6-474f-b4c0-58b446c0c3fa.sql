-- Create dashboard_versions table
CREATE TABLE public.dashboard_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  changes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_versions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read versions" 
ON public.dashboard_versions 
FOR SELECT 
USING (true);

-- Service role can insert/update
CREATE POLICY "Service can insert versions" 
ON public.dashboard_versions 
FOR INSERT 
WITH CHECK (true);

-- Insert initial version
INSERT INTO public.dashboard_versions (version, changes) 
VALUES ('1.0', 'Initial trading dashboard with CoinGlass integration');
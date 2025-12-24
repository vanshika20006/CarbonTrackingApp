-- Drop the SECURITY DEFINER view and recreate as a regular table function approach
DROP VIEW IF EXISTS public.leaderboard_weekly;

-- Create a function to get leaderboard data that respects RLS
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  weekly_emissions NUMERIC,
  entries_count BIGINT
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.avatar_url,
    COALESCE(SUM(ce.total_emissions), 0) as weekly_emissions,
    COUNT(ce.id) as entries_count
  FROM public.profiles p
  LEFT JOIN public.carbon_entries ce ON p.user_id = ce.user_id 
    AND ce.entry_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY p.user_id, p.full_name, p.avatar_url
  ORDER BY weekly_emissions ASC;
$$;

-- Add policy to allow reading all carbon entries for leaderboard calculations
CREATE POLICY "Allow reading entries for leaderboard" ON public.carbon_entries
  FOR SELECT USING (true);
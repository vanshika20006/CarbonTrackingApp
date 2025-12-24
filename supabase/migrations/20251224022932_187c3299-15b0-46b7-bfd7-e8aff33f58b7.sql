-- Drop and recreate the function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, weekly_emissions numeric, entries_count bigint)
LANGUAGE sql
SECURITY DEFINER
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
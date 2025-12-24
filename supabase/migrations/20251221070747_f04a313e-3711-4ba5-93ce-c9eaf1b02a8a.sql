-- Remove the overly broad authenticated SELECT policy
-- The leaderboard function uses SECURITY DEFINER so it can access data without this policy
DROP POLICY IF EXISTS "Authenticated users can read entries for leaderboard" ON public.carbon_entries;

-- Also tighten the profiles policy to only allow viewing own profile directly
-- The leaderboard function handles the aggregated view
DROP POLICY IF EXISTS "Authenticated users can view profiles for leaderboard" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
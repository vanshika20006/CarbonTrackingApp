-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Users can view all profiles for leaderboard" ON public.profiles;

-- Create a more restrictive policy - authenticated users can view basic profile info for leaderboard
CREATE POLICY "Authenticated users can view profiles for leaderboard" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Also drop the public carbon_entries policy and make it authenticated only
DROP POLICY IF EXISTS "Allow reading entries for leaderboard" ON public.carbon_entries;

CREATE POLICY "Authenticated users can read entries for leaderboard"
ON public.carbon_entries
FOR SELECT
TO authenticated
USING (true);
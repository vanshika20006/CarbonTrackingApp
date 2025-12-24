-- Drop the existing restrictive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new policy that allows all authenticated users to view all profiles (needed for leaderboard)
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Keep the existing insert and update policies as they are (users can only modify their own profile)